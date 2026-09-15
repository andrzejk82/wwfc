import {defineField, defineType} from 'sanity'

export const coach = defineType({
  name: 'coach', title: 'Trener', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Imię i nazwisko', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Adres', type: 'slug', options: {source: 'name', maxLength: 96}, validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Opis', type: 'text', rows: 6}),
    defineField({name: 'image', title: 'Zdjęcie', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', title: 'Tekst alternatywny', type: 'string', validation: (rule) => rule.required()})]}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})
