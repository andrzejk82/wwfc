import {useRef, useState} from 'react'
import {EyeOpenIcon} from '@sanity/icons'
import {useClient, type DocumentActionComponent, type SanityDocument} from 'sanity'
import {PublicationStatus} from '../components/PublicationStatus'

const API_VERSION = '2026-09-01'
const DRAFT_PREFIX = 'drafts.'
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

type PublicationUrlResult =
  | {ok: true; url: string}
  | {ok: false; reason: string}

type PreflightResult = {
  documentId: string
  revision: string
  validatedAt: string
}

type PublishDialog =
  | {kind: 'error'; message: string; accessUrl?: string}
  | {kind: 'status'; documentId: string; since: string}

class ReceiverAccessError extends Error {
  accessUrl: string

  constructor(accessUrl: string) {
    super('Sesja usługi publikacji wygasła. Zaloguj się i spróbuj ponownie.')
    this.accessUrl = accessUrl
  }
}

export const canonicalDocumentId = (documentId: string) =>
  documentId.startsWith(DRAFT_PREFIX) ? documentId.slice(DRAFT_PREFIX.length) : documentId

export function resolvePublicationUrl(value: string | undefined): PublicationUrlResult {
  if (!value?.trim()) {
    return {
      ok: false,
      reason: 'Publikacja jest wyłączona: nie skonfigurowano usługi publikacji.',
    }
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return {ok: false, reason: 'Adres usługi publikacji jest nieprawidłowy.'}
  }

  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && LOOPBACK_HOSTS.has(parsed.hostname))) {
    return {ok: false, reason: 'Adres usługi publikacji musi używać HTTPS.'}
  }

  return {ok: true, url: parsed.toString().replace(/\/$/, '')}
}

export function parsePreflightResponse(value: unknown, expectedDocumentId: string): PreflightResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Usługa publikacji zwróciła nieprawidłową odpowiedź walidacji.')
  }

  const result = value as {valid?: unknown; documentId?: unknown; revision?: unknown; validatedAt?: unknown}
  if (result.valid !== true || typeof result.documentId !== 'string' || typeof result.revision !== 'string') {
    throw new Error('Usługa publikacji nie potwierdziła poprawności szkicu.')
  }
  if (result.documentId !== expectedDocumentId) {
    throw new Error('Usługa publikacji zweryfikowała inny dokument. Spróbuj ponownie.')
  }
  if (!result.revision) {
    throw new Error('Usługa publikacji nie zwróciła wersji zweryfikowanego szkicu.')
  }

  if (typeof result.validatedAt !== 'string' || !Number.isFinite(Date.parse(result.validatedAt))) {
    throw new Error('Usługa publikacji nie zwróciła czasu walidacji.')
  }
  return {documentId: result.documentId, revision: result.revision, validatedAt: result.validatedAt}
}

export function assertCurrentDraftRevision(
  draft: Pick<SanityDocument, '_rev'> | null,
  validatedRevision: string,
): void {
  if (!draft) {
    throw new Error('Nie znaleziono bieżącego szkicu. Odśwież dokument i spróbuj ponownie.')
  }
  if (draft._rev !== validatedRevision) {
    throw new Error('Szkic zmienił się po walidacji. Uruchom publikację ponownie dla najnowszej wersji.')
  }
}

const receiverEndpoint = (baseUrl: string, path: string) =>
  `${baseUrl}/${path.replace(/^\//, '')}`

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return undefined
  return response.json()
}

async function runPreflight(baseUrl: string, documentId: string, revision: string): Promise<PreflightResult> {
  const response = await fetch(receiverEndpoint(baseUrl, 'preflight'), {
    method: 'POST',
    credentials: 'include',
    headers: {'content-type': 'application/json', accept: 'application/json'},
    body: JSON.stringify({documentId, revision}),
  })

  if (response.redirected || response.status === 401 || response.status === 403) {
    throw new ReceiverAccessError(receiverEndpoint(baseUrl, 'status'))
  }

  const body = await readJson(response)
  if (!response.ok) {
    const message = body && typeof body === 'object' && typeof (body as {message?: unknown}).message === 'string'
      ? (body as {message: string}).message
      : 'Walidacja przed publikacją nie powiodła się.'
    throw new Error(message)
  }

  return parsePreflightResponse(body, documentId)
}

const studioEnv = () => (import.meta as ImportMeta & {env?: Record<string, string | undefined>}).env ?? {}

export function createGuardedPublishAction(NativePublishAction: DocumentActionComponent): DocumentActionComponent {
  const GuardedPublishAction: DocumentActionComponent = (props) => {
    const client = useClient({apiVersion: API_VERSION})
    const [busy, setBusy] = useState(false)
    const [dialog, setDialog] = useState<PublishDialog>()
    const publishStartedAt = useRef<string | undefined>(undefined)
    const documentId = canonicalDocumentId(props.id)
    const publicationUrl = resolvePublicationUrl(studioEnv().SANITY_STUDIO_PUBLICATION_URL)

    const nativeAction = NativePublishAction({
      ...props,
      onComplete: () => {
        const since = publishStartedAt.current
        publishStartedAt.current = undefined
        setBusy(false)
        if (since && publicationUrl.ok) {
          setDialog({kind: 'status', documentId, since})
          return
        }
        props.onComplete()
      },
    })

    if (!nativeAction) return null

    const closeDialog = () => {
      const completedPublish = dialog?.kind === 'status'
      setDialog(undefined)
      if (completedPublish) props.onComplete()
    }

    return {
      ...nativeAction,
      label: busy ? 'Sprawdzanie przed publikacją…' : nativeAction.label,
      disabled: Boolean(nativeAction.disabled) || busy || !publicationUrl.ok,
      title: publicationUrl.ok ? nativeAction.title : publicationUrl.reason,
      dialog: dialog
        ? {
            type: 'dialog',
            header: dialog.kind === 'status' ? 'Status publikacji' : 'Publikacja zablokowana',
            width: 'medium',
            onClose: closeDialog,
            content: dialog.kind === 'status'
              ? (
                  <PublicationStatus
                    documentId={dialog.documentId}
                    mode="production"
                    publicationUrl={publicationUrl.ok ? publicationUrl.url : ''}
                    since={dialog.since}
                  />
                )
              : (
                  <div style={{padding: '1.25rem'}}>
                    <p>{dialog.message}</p>
                    {dialog.accessUrl ? (
                      <p>
                        <a href={dialog.accessUrl} rel="noreferrer" target="_blank">
                          Zaloguj się do chronionej usługi publikacji
                        </a>
                      </p>
                    ) : null}
                    <p>Szkic pozostał zapisany i możesz poprawić go lub ponowić publikację.</p>
                  </div>
                ),
          }
        : nativeAction.dialog,
      onHandle: async () => {
        if (!publicationUrl.ok || !props.draft?._rev || !nativeAction.onHandle) return
        setBusy(true)
        setDialog(undefined)
        try {
          const validated = await runPreflight(publicationUrl.url, documentId, props.draft._rev)
          const currentDraft = await client.fetch<Pick<SanityDocument, '_rev'> | null>(
            '*[_id == $draftId][0]{_rev}',
            {draftId: `${DRAFT_PREFIX}${documentId}`},
            {perspective: 'raw'},
          )
          assertCurrentDraftRevision(currentDraft, validated.revision)
          publishStartedAt.current = validated.validatedAt
          nativeAction.onHandle()
          // From here the native action owns its pending/error state. Its onComplete
          // callback is the only signal we use to say that Sanity finished publishing.
          setBusy(false)
        } catch (error) {
          publishStartedAt.current = undefined
          setBusy(false)
          setDialog({
            kind: 'error',
            message: error instanceof Error ? error.message : 'Nie udało się sprawdzić publikacji.',
            accessUrl: error instanceof ReceiverAccessError ? error.accessUrl : undefined,
          })
        }
      },
    }
  }

  GuardedPublishAction.action = 'publish'
  GuardedPublishAction.displayName = 'WWFCGuardedPublishAction'
  return GuardedPublishAction
}

export const ProtectedPreviewAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  const env = studioEnv()
  const publicationUrl = resolvePublicationUrl(env.SANITY_STUDIO_PUBLICATION_URL)
  const previewEnabled = env.SANITY_STUDIO_DRAFT_PREVIEW_ENABLED === 'true'
  const disabledReason = !publicationUrl.ok
    ? publicationUrl.reason
    : 'Chroniony podgląd szkiców jest wyłączony do czasu potwierdzenia ochrony dostępu.'

  return {
    action: 'wwfc-protected-preview',
    label: 'Chroniony podgląd szkiców',
    icon: EyeOpenIcon,
    disabled: !previewEnabled || !publicationUrl.ok,
    title: previewEnabled && publicationUrl.ok ? 'Zbuduj chroniony podgląd zapisanych szkiców.' : disabledReason,
    dialog: open && publicationUrl.ok
      ? {
          type: 'dialog',
          header: 'Chroniony podgląd szkiców',
          width: 'medium',
          onClose: () => setOpen(false),
          content: (
            <PublicationStatus
              documentId={canonicalDocumentId(props.id)}
              mode="preview"
              publicationUrl={publicationUrl.url}
            />
          ),
        }
      : undefined,
    onHandle: () => setOpen(true),
  }
}

ProtectedPreviewAction.displayName = 'WWFCProtectedPreviewAction'

const guardedActions = new WeakMap<DocumentActionComponent, DocumentActionComponent>()

export function addPublishingActions(previous: DocumentActionComponent[]): DocumentActionComponent[] {
  const actions = previous.map((action) => {
    if (action.action !== 'publish') return action
    const cached = guardedActions.get(action)
    if (cached) return cached
    const guarded = createGuardedPublishAction(action)
    guardedActions.set(action, guarded)
    return guarded
  })

  return actions.includes(ProtectedPreviewAction)
    ? actions
    : [...actions, ProtectedPreviewAction]
}
