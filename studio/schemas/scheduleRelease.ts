import {defineField, defineType} from 'sanity'
import {validateScheduleRelease, type ScheduleReleaseDocument} from '../lib/schedule-validation'

export const scheduleRelease = defineType({
  name: 'scheduleRelease', title: 'Wersja grafiku', type: 'document',
  description: 'Daty obowiązują włącznie według kalendarza Europe/Warsaw. Brak końca oznacza okres bez wskazanej daty końcowej.',
  validation: (rule) => rule.custom((value) => validateScheduleRelease(value as unknown as ScheduleReleaseDocument)),
  fields: [
    defineField({name: 'title', title: 'Nazwa wersji', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'validFrom', title: 'Obowiązuje od', type: 'date', validation: (rule) => rule.required()}),
    defineField({name: 'validTo', title: 'Obowiązuje do (włącznie)', type: 'date', description: 'Pozostaw puste dla okresu bez wskazanej daty końcowej.'}),
    defineField({name: 'publicationNote', title: 'Notatka publikacyjna', type: 'text', rows: 2}),
    defineField({name: 'sessions', title: 'Zajęcia cykliczne', type: 'array', description: 'Każda pozycja należy tylko do tej wersji. Nieznane zakończenia ograniczają wykrywanie kolizji; nie uzupełniaj ich na podstawie domysłów.', of: [{type: 'classSession'}], validation: (rule) => rule.required().min(1)}),
    defineField({name: 'exceptions', title: 'Odwołania i zastępstwa', type: 'array', of: [{type: 'sessionException'}], initialValue: []}),
    defineField({name: 'notices', title: 'Komunikaty i zamknięcia', type: 'array', of: [{type: 'notice'}], initialValue: []}),
  ],
  preview: {select: {title: 'title', from: 'validFrom', to: 'validTo'}, prepare: ({title, from, to}) => ({title: title || 'Wersja grafiku', subtitle: `${from || '?'} — ${to || 'bez końca'}`})},
})
