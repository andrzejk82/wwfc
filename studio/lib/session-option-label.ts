import type {ClassSession} from './schedule-validation'

const days = ['', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const rooms: Record<string, string> = {'mata-1': 'Mata 1', 'mata-2': 'Mata 2', salka: 'Salka', cardio: 'Cardio'}

export function sessionOptionLabel(session: ClassSession, disciplineName: string | undefined, index: number): string {
  return `${index + 1}. ${disciplineName?.trim() || 'Brak dyscypliny'} · ${days[session.weekday] ?? 'Brak dnia'}, ${session.startTime || 'brak godziny'} · ${rooms[session.room] ?? 'brak sali'}`
}