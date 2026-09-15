import {Select} from '@sanity/ui'
import {set, unset, useFormValue, type StringInputProps} from 'sanity'
import type {ClassSession} from '../lib/schedule-validation'

const days = ['', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const rooms: Record<string, string> = {'mata-1': 'Mata 1', 'mata-2': 'Mata 2', salka: 'Salka', cardio: 'Cardio'}

export function SessionSelect(props: StringInputProps) {
  const sessions = (useFormValue(['sessions']) as ClassSession[] | undefined) ?? []
  return <Select {...props.elementProps} value={props.value ?? ''} disabled={props.readOnly}
    onChange={event => props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())}>
    <option value="">Wybierz zajęcia z tej wersji grafiku</option>
    {props.value && !sessions.some(session => session._key === props.value) && <option value={props.value}>Usunięte zajęcia — wybierz ponownie</option>}
    {sessions.map((session, index) => <option key={session._key} value={session._key}>
      {index + 1}. {days[session.weekday] ?? 'Brak dnia'}, {session.startTime ?? 'brak godziny'} · {rooms[session.room] ?? 'brak sali'}
    </option>)}
  </Select>
}
