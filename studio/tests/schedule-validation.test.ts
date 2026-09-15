import assert from 'node:assert/strict'
import test from 'node:test'
import {
  copyScheduleRelease,
  validateClassSession,
  validateScheduleRelease,
  type ScheduleReleaseDocument,
} from '../lib/schedule-validation'

const release: ScheduleReleaseDocument = {
  _id: 'schedule-wrzesien-2026',
  _type: 'scheduleRelease',
  title: 'Wrzesień 2026',
  validFrom: '2026-09-01',
  validTo: '2026-09-30',
  sessions: [{
    _key: 'boxing-tuesday', _type: 'classSession', weekday: 2,
    startTime: '18:00', endTime: '19:00',
    discipline: {_type: 'reference', _ref: 'discipline-boks'},
    coach: {_type: 'reference', _ref: 'coach-norbert'},
    room: 'mata-1', audience: 'general', ageMin: null, ageMax: null,
    level: 'intro', sortOrder: 0, archived: false,
  }],
  exceptions: [],
  notices: [],
}

test('accepts a valid schedule release', () => {
  assert.equal(validateScheduleRelease(release), true)
})

test('handles an empty editor object and rejects metadata-only replacement', () => {
  assert.equal(validateClassSession(undefined), true)
  const invalid = structuredClone(release)
  invalid.exceptions = [{_key: 'a', _type: 'sessionException', sessionKey: 'boxing-tuesday', date: '2026-09-15', kind: 'changed', explanation: 'Zmiana', replacement: {_type: 'replacement'} as any}]
  assert.notEqual(validateScheduleRelease(invalid), true)
})

test('uses domain validation for conflicts after replacements', () => {
  const invalid = structuredClone(release)
  invalid.sessions.push({...structuredClone(invalid.sessions[0]!), _key: 'second', startTime: '19:00', endTime: '20:00'})
  assert.equal(validateScheduleRelease(invalid), true)
  invalid.exceptions = [{_key: 'a', _type: 'sessionException', sessionKey: 'second', date: '2026-09-15', kind: 'changed', explanation: 'Zmiana', replacement: {startTime: '18:30'}}]
  assert.match(String(validateScheduleRelease(invalid)), /Konflikt sali/)
})

test('allows explicitly unknown ending for a one-date replacement', () => {
  const changed = structuredClone(release)
  changed.exceptions = [{_key: 'a', _type: 'sessionException', sessionKey: 'boxing-tuesday', date: '2026-09-15', kind: 'changed', explanation: 'Koniec do ustalenia', replacement: {startTime: '20:00', endTimeUnknown: true}}]
  assert.equal(validateScheduleRelease(changed), true)
})

test('rejects invalid times and child sessions without a minimum age', () => {
  const invalid = structuredClone(release)
  invalid.sessions[0]!.endTime = '17:00'
  invalid.sessions[0]!.audience = 'children'
  assert.match(String(validateScheduleRelease(invalid)), /późniejsza/)
})

test('rejects duplicate or off-day exceptions and empty changes', () => {
  const invalid = structuredClone(release)
  invalid.exceptions = [
    {_key: 'a', _type: 'sessionException', sessionKey: 'boxing-tuesday', date: '2026-09-16', kind: 'changed', explanation: 'Zmiana', replacement: {}},
    {_key: 'b', _type: 'sessionException', sessionKey: 'boxing-tuesday', date: '2026-09-16', kind: 'cancelled', explanation: 'Odwołane'},
  ]
  const result = String(validateScheduleRelease(invalid))
  assert.match(result, /wtorek/)
  assert.match(result, /co najmniej jedną/)
  assert.match(result, /Powtórzony wyjątek/)
})

test('rejects nonexistent dates, unknown session keys and dates outside a release', () => {
  const invalid = structuredClone(release)
  invalid.exceptions = [
    {_key: 'a', _type: 'sessionException', sessionKey: 'missing', date: '2026-02-30', kind: 'cancelled', explanation: 'Test'},
    {_key: 'b', _type: 'sessionException', sessionKey: 'boxing-tuesday', date: '2026-10-06', kind: 'cancelled', explanation: 'Test'},
  ]
  const result = String(validateScheduleRelease(invalid))
  assert.match(result, /Nieprawidłowa data/)
  assert.match(result, /nieistniejących zajęć/)
  assert.match(result, /poza okresem/)
})

test('copies sessions independently and clears all dated data', () => {
  const source = structuredClone(release)
  source.exceptions = [{_key: 'e1', _type: 'sessionException', sessionKey: 'boxing-tuesday', date: '2026-09-15', kind: 'cancelled', explanation: 'Test'}]
  source.notices = [{_key: 'n1', _type: 'notice', title: 'Zamknięte', message: '', startDate: '2026-09-15', endDate: '2026-09-15', closed: true}]
  const copy = copyScheduleRelease(source, 'schedule-copy', () => 'fresh-key')
  assert.equal(copy._id, 'schedule-copy')
  assert.equal(copy.title, 'Wrzesień 2026 — kopia')
  assert.equal(copy.sessions[0]!._key, 'fresh-key')
  assert.deepEqual(copy.exceptions, [])
  assert.deepEqual(copy.notices, [])
  copy.sessions[0]!.startTime = '20:00'
  assert.equal(source.sessions[0]!.startTime, '18:00')
})
