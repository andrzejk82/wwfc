import {validateReleases} from '../../src/lib/content/schemas'

export type Reference = {_type: 'reference'; _ref: string}
export type ClassSession = {
  _key: string; _type: 'classSession'; weekday: number; startTime: string; endTime?: string | null
  discipline: Reference; coach: Reference; room: 'mata-1' | 'mata-2' | 'salka' | 'cardio'
  audience: 'general' | 'children' | 'women'; ageMin?: number | null; ageMax?: number | null
  level?: 'intro' | 'beginner' | 'mixed' | 'intermediate' | 'sparring' | null
  sortOrder: number; archived: boolean
}
export type SessionException = {
  _key: string; _type: 'sessionException'; sessionKey: string; date: string
  kind: 'cancelled' | 'changed'; explanation: string
  replacement?: {startTime?: string; endTime?: string | null; endTimeUnknown?: boolean; room?: ClassSession['room']; coach?: Reference}
}
export type Notice = {_key: string; _type: 'notice'; title: string; message: string; startDate: string; endDate: string; closed: boolean}
export type ScheduleReleaseDocument = {
  _id?: string; _type: 'scheduleRelease'; title: string; validFrom: string; validTo?: string | null
  publicationNote?: string; sessions: ClassSession[]; exceptions: SessionException[]; notices: Notice[]
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const keyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year!, month! - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month! - 1 && parsed.getUTCDate() === day
}

function weekday(value: string): number {
  return new Date(`${value}T12:00:00Z`).getUTCDay() || 7
}

function validateTimes(start: string | undefined, end: string | null | undefined, label: string, errors: string[]) {
  if (!start || !timePattern.test(start)) errors.push(`${label}: godzina rozpoczęcia musi mieć format HH:mm.`)
  if (end != null && !timePattern.test(end)) errors.push(`${label}: godzina zakończenia musi mieć format HH:mm.`)
  if (start && end && timePattern.test(start) && timePattern.test(end) && end <= start) {
    errors.push(`${label}: godzina zakończenia musi być późniejsza niż rozpoczęcia.`)
  }
}

export function validateClassSession(session: ClassSession | undefined): true | string {
  if (!session) return true
  const errors: string[] = []
  if (!keyPattern.test(session._key || '')) errors.push('Klucz zajęć musi być stabilnym slugiem.')
  if (!Number.isInteger(session.weekday) || session.weekday < 1 || session.weekday > 7) errors.push('Dzień tygodnia musi mieścić się w zakresie 1–7.')
  validateTimes(session.startTime, session.endTime, `Zajęcia ${session._key || 'bez klucza'}`, errors)
  if (!session.discipline?._ref) errors.push('Wybierz dyscyplinę.')
  if (!session.coach?._ref) errors.push('Wybierz trenera.')
  if (session.audience === 'children' && session.ageMin == null) errors.push('Dla zajęć dziecięcych podaj minimalny wiek.')
  if (session.ageMin != null && session.ageMax != null && session.ageMin > session.ageMax) errors.push('Minimalny wiek nie może być większy od maksymalnego.')
  return errors.length ? errors.join(' ') : true
}

export function validateScheduleRelease(release: ScheduleReleaseDocument | undefined): true | string {
  if (!release) return true
  const errors: string[] = []
  if (!isCalendarDate(release.validFrom)) errors.push('Nieprawidłowa data początku okresu.')
  if (release.validTo && !isCalendarDate(release.validTo)) errors.push('Nieprawidłowa data końca okresu.')
  if (release.validTo && release.validFrom > release.validTo) errors.push('Data końca okresu musi przypadać po jego początku.')

  const sessions = new Map<string, ClassSession>()
  for (const session of release.sessions ?? []) {
    const local = validateClassSession(session)
    if (local !== true) errors.push(local)
    if (sessions.has(session._key)) errors.push(`Powtórzony klucz zajęć: ${session._key}.`)
    sessions.set(session._key, session)
  }

  const exceptionKeys = new Set<string>()
  for (const exception of release.exceptions ?? []) {
    const session = sessions.get(exception.sessionKey)
    if (!isCalendarDate(exception.date)) errors.push(`Nieprawidłowa data wyjątku: ${exception.date}.`)
    if (!session) errors.push(`Wyjątek wskazuje nieistniejących zajęć: ${exception.sessionKey}.`)
    if (isCalendarDate(exception.date) && (exception.date < release.validFrom || Boolean(release.validTo && exception.date > release.validTo))) {
      errors.push(`Wyjątek ${exception.date} leży poza okresem grafiku.`)
    }
    if (session && isCalendarDate(exception.date) && weekday(exception.date) !== session.weekday) {
      errors.push(`Wyjątek ${exception.date} nie przypada w dzień zajęć (${session.weekday === 2 ? 'wtorek' : `dzień ${session.weekday}`}).`)
    }
    const uniqueKey = `${exception.sessionKey}:${exception.date}`
    if (exceptionKeys.has(uniqueKey)) errors.push(`Powtórzony wyjątek dla ${exception.sessionKey} w dniu ${exception.date}.`)
    exceptionKeys.add(uniqueKey)
    const replacement = exception.replacement?.endTimeUnknown ? {...exception.replacement, endTime: null} : exception.replacement
    if (exception.kind === 'changed' && (!replacement || !['startTime', 'endTime', 'room', 'coach'].some(key => Object.hasOwn(replacement, key)))) {
      errors.push('Zmiana wymaga podania co najmniej jedną wartości zastępczej.')
    }
    if (replacement && session) validateTimes(replacement.startTime ?? session.startTime, replacement.endTime === undefined ? session.endTime : replacement.endTime, `Wyjątek ${exception.date}`, errors)
  }

  for (const notice of release.notices ?? []) {
    if (!isCalendarDate(notice.startDate) || !isCalendarDate(notice.endDate)) errors.push(`Nieprawidłowa data komunikatu: ${notice.title}.`)
    else if (notice.startDate > notice.endDate) errors.push(`Komunikat „${notice.title}” ma odwrócony zakres dat.`)
  }
  if (errors.length) return errors.join('\n')
  // Reuse the same domain rules as the website, including dated room collisions.
  try {
    validateReleases([{
      id: 'studio-validation', title: release.title, validFrom: release.validFrom, validTo: release.validTo ?? null,
      sessions: (release.sessions ?? []).map(session => ({...session, key: session._key,
        disciplineSlug: 'selected-discipline', coachSlug: 'selected-coach',
        endTime: session.endTime ?? null, ageMin: session.ageMin ?? null, ageMax: session.ageMax ?? null,
        level: session.level ?? null, sortOrder: session.sortOrder ?? 0, archived: session.archived ?? false})),
      exceptions: (release.exceptions ?? []).map(exception => ({...exception,
        ...(exception.replacement ? {replacement: {...exception.replacement,
          ...(exception.replacement.endTimeUnknown ? {endTime: null} : {}),
          ...(exception.replacement.coach ? {coachSlug: 'replacement-coach'} : {})}} : {})})),
      notices: (release.notices ?? []).map(notice => ({...notice, key: notice._key, message: notice.message ?? '', closed: notice.closed ?? false})),
    }])
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) return 'Uzupełnij wymagane pola grafiku i sprawdź wartości zajęć.'
    return error instanceof Error ? error.message : 'Nieprawidłowy grafik.'
  }
}

export function copyScheduleRelease(source: ScheduleReleaseDocument, id: string, keyFactory: () => string): ScheduleReleaseDocument {
  return {
    _id: id,
    _type: 'scheduleRelease',
    title: `${source.title} — kopia`,
    validFrom: source.validFrom,
    validTo: source.validTo ?? null,
    publicationNote: source.publicationNote,
    sessions: (source.sessions ?? []).map((session) => ({...structuredClone(session), _key: keyFactory()})),
    exceptions: [],
    notices: [],
  }
}
