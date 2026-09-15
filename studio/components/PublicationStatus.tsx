import {useEffect, useMemo, useState} from 'react'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_ATTEMPTS = 60
const TERMINAL_PHASES = new Set(['succeeded', 'failed'])

export type PublicationPhase = 'pending' | 'running' | 'succeeded' | 'failed'

export type PublicationStatusValue = {
  requestId: string
  dataset: string
  target: string
  phase: PublicationPhase
  createdAt: string
  updatedAt: string
  documentId?: string
  documentRevision?: string
  commit?: string
  snapshotHash?: string
  deploymentUrl?: string
  error?: string
}

type PublicationStatusProps = {
  documentId: string
  mode: 'production' | 'preview'
  publicationUrl: string
  since?: string
}

type Tracking = {requestId: string} | {documentId: string; since: string}

class AccessRequiredError extends Error {}

const endpoint = (baseUrl: string, path: string) => `${baseUrl}/${path.replace(/^\//, '')}`

function accessUrl(baseUrl: string) {
  return endpoint(baseUrl, 'status')
}

function parseStatus(value: unknown): PublicationStatusValue | null {
  const wrapped = value && typeof value === 'object' && 'status' in value
    ? (value as {status?: unknown}).status
    : value
  if (wrapped === null) return null
  if (!wrapped || typeof wrapped !== 'object') throw new Error('Usługa zwróciła nieprawidłowy status publikacji.')

  const status = wrapped as Partial<PublicationStatusValue>
  if (
    typeof status.requestId !== 'string'
    || typeof status.dataset !== 'string'
    || typeof status.target !== 'string'
    || typeof status.createdAt !== 'string'
    || typeof status.updatedAt !== 'string'
    || !['pending', 'running', 'succeeded', 'failed'].includes(status.phase ?? '')
  ) {
    throw new Error('Usługa zwróciła niepełny status publikacji.')
  }
  return status as PublicationStatusValue
}

async function requestStatus(url: string, init?: RequestInit): Promise<PublicationStatusValue | null> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {accept: 'application/json', ...init?.headers},
  })
  if (response.redirected || response.status === 401 || response.status === 403) {
    throw new AccessRequiredError('Zaloguj się do chronionej usługi publikacji.')
  }

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : undefined
  if (!response.ok) {
    const message = body && typeof body === 'object' && typeof (body as {message?: unknown}).message === 'string'
      ? (body as {message: string}).message
      : 'Nie udało się odczytać statusu publikacji.'
    throw new Error(message)
  }
  return parseStatus(body)
}

const statusQuery = (baseUrl: string, tracking: Tracking) => {
  const url = new URL(endpoint(baseUrl, 'status'))
  if ('requestId' in tracking) {
    url.searchParams.set('requestId', tracking.requestId)
  } else {
    url.searchParams.set('documentId', tracking.documentId)
    url.searchParams.set('since', tracking.since)
  }
  return url.toString()
}

const phaseCopy: Record<PublicationPhase, {tone: 'default' | 'primary' | 'positive' | 'critical'; text: string}> = {
  pending: {tone: 'default', text: 'Oczekuje w kolejce'},
  running: {tone: 'primary', text: 'Trwa budowanie strony'},
  succeeded: {tone: 'positive', text: 'Strona została zaktualizowana'},
  failed: {tone: 'critical', text: 'Aktualizacja strony nie powiodła się'},
}

export function PublicationStatus({documentId, mode, publicationUrl, since}: PublicationStatusProps) {
  const initialTracking = useMemo<Tracking | undefined>(
    () => mode === 'production' && since ? {documentId, since} : undefined,
    [documentId, mode, since],
  )
  const [tracking, setTracking] = useState<Tracking | undefined>(initialTracking)
  const [status, setStatus] = useState<PublicationStatusValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  const [needsAccess, setNeedsAccess] = useState(false)

  useEffect(() => {
    if (!tracking) return undefined

    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const poll = async () => {
      controller = new AbortController()
      try {
        const next = await requestStatus(statusQuery(publicationUrl, tracking), {signal: controller.signal})
        if (cancelled) return
        attempts += 1
        setNeedsAccess(false)
        if (next) {
          setStatus(next)
          setMessage(undefined)
          if (TERMINAL_PHASES.has(next.phase)) return
        } else {
          setMessage(mode === 'production'
            ? 'Publikacja w CMS została zakończona. Oczekiwanie na zlecenie aktualizacji strony…'
            : 'Oczekiwanie na zlecenie podglądu…')
        }
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setMessage('Automatyczne sprawdzanie zakończono. Użyj przycisku „Sprawdź ponownie”.')
          return
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return
        setNeedsAccess(error instanceof AccessRequiredError)
        setMessage(error instanceof Error ? error.message : 'Nie udało się odczytać statusu publikacji.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    setBusy(true)
    void poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      controller?.abort()
    }
  }, [mode, publicationUrl, tracking])

  const startPreview = async () => {
    setBusy(true)
    setMessage(undefined)
    try {
      const next = await requestStatus(endpoint(publicationUrl, 'preview'), {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: '{}',
      })
      if (!next) throw new Error('Usługa nie utworzyła zlecenia podglądu.')
      setStatus(next)
      setTracking({requestId: next.requestId})
    } catch (error) {
      setNeedsAccess(error instanceof AccessRequiredError)
      setMessage(error instanceof Error ? error.message : 'Nie udało się uruchomić podglądu.')
      setBusy(false)
    }
  }

  const retry = async () => {
    if (!status) return
    setBusy(true)
    setMessage(undefined)
    try {
      const next = await requestStatus(endpoint(publicationUrl, 'retry'), {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({requestId: status.requestId}),
      })
      if (!next) throw new Error('Usługa nie utworzyła ponownego zlecenia.')
      setStatus(next)
      setTracking({requestId: next.requestId})
    } catch (error) {
      setNeedsAccess(error instanceof AccessRequiredError)
      setMessage(error instanceof Error ? error.message : 'Nie udało się ponowić publikacji.')
      setBusy(false)
    }
  }

  const checkAgain = () => {
    if (!tracking) return
    setMessage(undefined)
    setTracking({...tracking})
  }

  const phase = status ? phaseCopy[status.phase] : undefined
  const targetLabel = status?.target === 'draft-preview' ? 'chroniony podgląd' : 'strona produkcyjna'

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Card padding={3} radius={2} tone="caution">
          <Text size={1}>
            {mode === 'production'
              ? 'Publikacja w CMS została potwierdzona przez Sanity. Aktualizacja strony jest osobnym procesem.'
              : 'Podgląd zawiera zapisane szkice i jest przeznaczony wyłącznie dla uprawnionych redaktorów.'}
          </Text>
        </Card>

        {phase ? (
          <Card padding={4} radius={2} tone={phase.tone}>
            <Stack space={3}>
              <Text weight="semibold">{phase.text}</Text>
              <Text muted size={1}>Zbiór danych: {status?.dataset} · Cel: {targetLabel}</Text>
              {status?.error ? <Text size={1}>{status.error}</Text> : null}
              {status?.snapshotHash ? <Text muted size={1}>Snapshot: {status.snapshotHash}</Text> : null}
              {status?.commit ? <Text muted size={1}>Commit: {status.commit}</Text> : null}
              {status?.deploymentUrl && status.phase === 'succeeded' ? (
                <Text size={1}>
                  <a href={status.deploymentUrl} rel="noreferrer" target="_blank">Otwórz zaktualizowaną stronę</a>
                </Text>
              ) : null}
            </Stack>
          </Card>
        ) : null}

        {message ? <Text size={1}>{message}</Text> : null}
        {needsAccess ? (
          <Text size={1}>
            <a href={accessUrl(publicationUrl)} rel="noreferrer" target="_blank">
              Zaloguj się do chronionej usługi publikacji
            </a>
          </Text>
        ) : null}

        <Flex align="center" gap={3} wrap="wrap">
          {busy ? <Spinner muted /> : null}
          {mode === 'preview' && !tracking ? (
            <Button disabled={busy} onClick={startPreview} text="Utwórz chroniony podgląd" tone="primary" />
          ) : null}
          {status?.phase === 'failed' ? (
            <Button disabled={busy} onClick={retry} text="Ponów aktualizację" tone="critical" />
          ) : null}
          {tracking && (!status || !TERMINAL_PHASES.has(status.phase)) && !busy ? (
            <Button mode="ghost" onClick={checkAgain} text="Sprawdź ponownie" />
          ) : null}
        </Flex>
      </Stack>
    </Box>
  )
}
