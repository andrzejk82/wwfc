import {defineField, defineType} from 'sanity'

export const faqItem = defineType({
  name: 'faqItem', title: 'Pytanie i odpowiedź', type: 'document',
  fields: [
    defineField({name: 'question', title: 'Pytanie', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'answer', title: 'Odpowiedź', type: 'text', rows: 5, validation: (rule) => rule.required()}),
    defineField({name: 'sortOrder', title: 'Kolejność', type: 'number', initialValue: 0, validation: (rule) => rule.required().integer()}),
  ],
  preview: {select: {title: 'question'}},
})
