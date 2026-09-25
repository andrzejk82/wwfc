import assert from 'node:assert/strict'
import test from 'node:test'
import {sessionOptionLabel} from '../lib/session-option-label'
import type {ClassSession} from '../lib/schedule-validation'

const session = {
  weekday: 2,
  startTime: '18:00',
  room: 'mata-1',
} as ClassSession

test('session choices include the discipline beside the timetable', () => {
  assert.equal(sessionOptionLabel(session, 'Boks', 0), '1. Boks · Wtorek, 18:00 · Mata 1')
})

test('session choices identify a missing discipline', () => {
  assert.equal(sessionOptionLabel(session, undefined, 1), '2. Brak dyscypliny · Wtorek, 18:00 · Mata 1')
})