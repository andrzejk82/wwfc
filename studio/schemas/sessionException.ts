import {defineField, defineType} from 'sanity'
import {SessionSelect} from '../components/SessionSelect'

const time = /^([01]\d|2[0-3]):[0-5]\d$/

export const sessionException = defineType({
  name: 'sessionException', title: 'Wyjątek w grafiku', type: 'object',
  fields: [
    defineField({name: 'sessionKey', title: 'Zajęcia', type: 'string', components: {input: SessionSelect}, description: 'Wybierz pozycję z zajęć cyklicznych w tej wersji grafiku.', validation: (rule) => rule.required()}),
    defineField({name: 'date', title: 'Data', type: 'date', description: 'Data kalendarzowa Europe/Warsaw.', validation: (rule) => rule.required()}),
    defineField({name: 'kind', title: 'Rodzaj', type: 'string', options: {layout: 'radio', list: [{title: 'Odwołane', value: 'cancelled'}, {title: 'Zmienione', value: 'changed'}]}, validation: (rule) => rule.required()}),
    defineField({name: 'explanation', title: 'Wyjaśnienie', type: 'string', validation: (rule) => rule.required().min(1)}),
    defineField({name: 'replacement', title: 'Wartości zastępcze', type: 'object', hidden: ({parent}) => parent?.kind !== 'changed', fields: [
      defineField({name: 'startTime', title: 'Nowy początek', type: 'string', validation: (rule) => rule.regex(time, {name: 'HH:mm'})}),
      defineField({name: 'endTimeUnknown', title: 'Godzina końca nieznana', type: 'boolean', description: 'Włączenie usuwa godzinę końca tylko dla tego wystąpienia zajęć.'}),
      defineField({name: 'endTime', title: 'Nowy koniec', type: 'string', hidden: ({parent}) => parent?.endTimeUnknown === true, description: 'Puste pole zachowuje godzinę końca z zajęć cyklicznych. Użyj przełącznika powyżej, aby oznaczyć nieznany koniec.', validation: (rule) => rule.regex(time, {name: 'HH:mm'})}),
      defineField({name: 'room', title: 'Nowa sala', type: 'string', options: {list: [
        {title: 'Mata 1', value: 'mata-1'}, {title: 'Mata 2', value: 'mata-2'}, {title: 'Salka', value: 'salka'}, {title: 'Cardio', value: 'cardio'},
      ]}}),
      defineField({name: 'coach', title: 'Nowy trener', type: 'reference', to: [{type: 'coach'}]}),
    ]}),
  ],
  preview: {select: {title: 'sessionKey', date: 'date', kind: 'kind'}, prepare: ({title, date, kind}) => ({title: title || 'Wyjątek', subtitle: `${date || 'bez daty'} · ${kind === 'cancelled' ? 'odwołane' : 'zmienione'}`})},
})
