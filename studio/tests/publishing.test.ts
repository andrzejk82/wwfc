import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
  assertCurrentDraftRevision,
  canonicalDocumentId,
  parsePreflightResponse,
  resolvePublicationUrl,
} from '../actions/publishing'

describe('canonicalDocumentId', () => {
  it('removes only the Sanity drafts prefix', () => {
    assert.equal(canonicalDocumentId('drafts.schedule-release-2026'), 'schedule-release-2026')
    assert.equal(canonicalDocumentId('schedule-release-2026'), 'schedule-release-2026')
  })
})

describe('resolvePublicationUrl', () => {
  it('requires HTTPS for a remote receiver', () => {
    assert.deepEqual(resolvePublicationUrl('http://publishing.example.com'), {
      ok: false,
      reason: 'Adres usługi publikacji musi używać HTTPS.',
    })
  })

  it('allows HTTP only for a loopback development receiver', () => {
    assert.deepEqual(resolvePublicationUrl('http://localhost:8787/'), {
      ok: true,
      url: 'http://localhost:8787',
    })
    assert.deepEqual(resolvePublicationUrl('http://127.0.0.1:8787/api'), {
      ok: true,
      url: 'http://127.0.0.1:8787/api',
    })
  })

  it('disables publishing when no receiver is configured', () => {
    assert.deepEqual(resolvePublicationUrl(undefined), {
      ok: false,
      reason: 'Publikacja jest wyłączona: nie skonfigurowano usługi publikacji.',
    })
  })
})

describe('parsePreflightResponse', () => {
  it('accepts the validated canonical document and revision', () => {
    assert.deepEqual(
      parsePreflightResponse(
        {valid: true, documentId: 'schedule-release-2026', revision: 'draft-revision', validatedAt: '2026-09-15T00:00:00.000Z'},
        'schedule-release-2026',
      ),
      {documentId: 'schedule-release-2026', revision: 'draft-revision', validatedAt: '2026-09-15T00:00:00.000Z'},
    )
  })

  it('rejects a response for another document', () => {
    assert.throws(
      () => parsePreflightResponse(
        {valid: true, documentId: 'another-document', revision: 'draft-revision'},
        'schedule-release-2026',
      ),
      /inny dokument/,
    )
  })
})

describe('assertCurrentDraftRevision', () => {
  it('blocks native publish when the draft changed after preflight', () => {
    assert.throws(
      () => assertCurrentDraftRevision({_rev: 'new-revision'}, 'validated-revision'),
      /Szkic zmienił się po walidacji/,
    )
  })

  it('keeps the validated draft publishable when its revision is unchanged', () => {
    assert.doesNotThrow(() => assertCurrentDraftRevision({_rev: 'validated-revision'}, 'validated-revision'))
  })

  it('blocks publishing when the draft disappeared', () => {
    assert.throws(() => assertCurrentDraftRevision(null, 'validated-revision'), /Nie znaleziono bieżącego szkicu/)
  })
})
