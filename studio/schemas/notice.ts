import {defineField, defineType} from 'sanity'

export const notice = defineType({
  name: 'notice', title: 'Komunikat okresowy', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Tytuł', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'message', title: 'Treść', type: 'text', rows: 3}),
    defineField({name: 'startDate', title: 'Od', type: 'date', validation: (rule) => rule.required()}),
    defineField({name: 'endDate', title: 'Do (włącznie)', type: 'date', validation: (rule) => rule.required().custom((end, context) => !end || !context.parent || end >= String((context.parent as {startDate?: string}).startDate || '') || 'Data końcowa nie może poprzedzać początkowej.')}),
    defineField({name: 'closed', title: 'Klub zamknięty', type: 'boolean', description: 'Zamknięcie ma pierwszeństwo przed zastępstwami w tym okresie.', initialValue: false, validation: (rule) => rule.required()}),
  ],
})
