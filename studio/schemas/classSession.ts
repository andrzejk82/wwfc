import {defineField, defineType} from 'sanity'
import {validateClassSession, type ClassSession} from '../lib/schedule-validation'

const time = /^([01]\d|2[0-3]):[0-5]\d$/

export const classSession = defineType({
  name: 'classSession',
  title: 'Zajęcia cykliczne',
  type: 'object',
  description: 'Godziny pozostają nieznane, jeśli źródło nie podaje zakończenia. Studio nie domyśla czasu trwania.',
  validation: (rule) => rule.custom((value) => validateClassSession(value as ClassSession)),
  fields: [
    defineField({name: 'weekday', title: 'Dzień tygodnia', type: 'number', options: {list: [
      {title: 'Poniedziałek', value: 1}, {title: 'Wtorek', value: 2}, {title: 'Środa', value: 3},
      {title: 'Czwartek', value: 4}, {title: 'Piątek', value: 5}, {title: 'Sobota', value: 6}, {title: 'Niedziela', value: 7},
    ]}, validation: (rule) => rule.required().integer().min(1).max(7)}),
    defineField({name: 'startTime', title: 'Początek', type: 'string', description: 'Format 24-godzinny HH:mm.', validation: (rule) => rule.required().regex(time, {name: 'HH:mm'})}),
    defineField({name: 'endTime', title: 'Koniec', type: 'string', description: 'Pozostaw puste, gdy źródło nie podaje godziny. Nie domyślamy czasu trwania.', validation: (rule) => rule.regex(time, {name: 'HH:mm'})}),
    defineField({name: 'discipline', title: 'Dyscyplina', type: 'reference', to: [{type: 'discipline'}], validation: (rule) => rule.required()}),
    defineField({name: 'coach', title: 'Trener', type: 'reference', to: [{type: 'coach'}], validation: (rule) => rule.required()}),
    defineField({name: 'room', title: 'Sala', type: 'string', options: {list: [
      {title: 'Mata 1', value: 'mata-1'}, {title: 'Mata 2', value: 'mata-2'}, {title: 'Salka', value: 'salka'}, {title: 'Cardio', value: 'cardio'},
    ]}, validation: (rule) => rule.required()}),
    defineField({name: 'audience', title: 'Grupa', type: 'string', options: {list: [
      {title: 'Ogólna', value: 'general'}, {title: 'Dzieci', value: 'children'}, {title: 'Kobiety', value: 'women'},
    ]}, validation: (rule) => rule.required()}),
    defineField({name: 'ageMin', title: 'Wiek od', type: 'number', validation: (rule) => rule.integer().min(0).max(100)}),
    defineField({name: 'ageMax', title: 'Wiek do', type: 'number', validation: (rule) => rule.integer().min(0).max(100)}),
    defineField({name: 'level', title: 'Poziom', type: 'string', options: {list: [
      {title: 'Wprowadzenie', value: 'intro'}, {title: 'Początkujący', value: 'beginner'}, {title: 'Mieszany', value: 'mixed'},
      {title: 'Średniozaawansowany', value: 'intermediate'}, {title: 'Sparingi', value: 'sparring'},
    ]}}),
    defineField({name: 'sortOrder', title: 'Kolejność', type: 'number', initialValue: 0, validation: (rule) => rule.required().integer()}),
    defineField({name: 'archived', title: 'Archiwalne', type: 'boolean', initialValue: false, validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {title: 'discipline.name', coach: 'coach.name', weekday: 'weekday', start: 'startTime', end: 'endTime'},
    prepare: ({title, coach, weekday, start, end}) => ({title: title || 'Zajęcia', subtitle: `Dzień ${weekday}, ${start}${end ? `–${end}` : '–?'} · ${coach || 'bez trenera'}`}),
  },
})
