import {defineField, defineType} from 'sanity'

export const priceGroup = defineType({
  name: 'priceGroup', title: 'Grupa cenowa', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Identyfikator', type: 'slug', options: {source: 'name', maxLength: 96}, validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Opis', type: 'text', rows: 3}),
    defineField({name: 'rows', title: 'Pozycje cennika', type: 'array', of: [{type: 'object', name: 'priceRow', title: 'Pozycja', fields: [
      defineField({name: 'label', title: 'Nazwa', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'price', title: 'Cena', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'note', title: 'Uwagi', type: 'string'}),
    ]}]}),
    defineField({name: 'sortOrder', title: 'Kolejność', type: 'number', initialValue: 0, validation: (rule) => rule.required().integer()}),
  ],
})
