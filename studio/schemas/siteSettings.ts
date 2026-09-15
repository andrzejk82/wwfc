import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Ustawienia klubu', type: 'document',
  initialValue: {approved: false, legal: {approved: false}},
  fields: [
    defineField({name: 'approved', title: 'Treści zatwierdzone do produkcji', type: 'boolean', description: 'Pozostaw wyłączone do zakończenia odbioru treści.', initialValue: false, validation: (rule) => rule.required()}),
    defineField({name: 'clubName', title: 'Nazwa klubu', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'address', title: 'Adres', type: 'object', fields: [
      defineField({name: 'street', title: 'Ulica i numer', type: 'string'}),
      defineField({name: 'postalCode', title: 'Kod pocztowy', type: 'string'}),
      defineField({name: 'city', title: 'Miasto', type: 'string'}),
    ]}),
    defineField({name: 'coordinates', title: 'Współrzędne', type: 'geopoint'}),
    defineField({name: 'phone', title: 'Telefon', type: 'string'}),
    defineField({name: 'email', title: 'E-mail', type: 'string', validation: (rule) => rule.email()}),
    defineField({name: 'openingHours', title: 'Godziny otwarcia', type: 'array', of: [{type: 'object', name: 'openingHoursRow', title: 'Dzień', fields: [
      defineField({name: 'day', title: 'Numer dnia (1–7)', type: 'number', validation: (rule) => rule.required().integer().min(1).max(7)}),
      defineField({name: 'label', title: 'Etykieta', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'hours', title: 'Godziny', type: 'string', validation: (rule) => rule.required()}),
    ]}]}),
    defineField({name: 'socialLinks', title: 'Profile społecznościowe', type: 'array', of: [{type: 'object', name: 'socialLink', title: 'Profil', fields: [
      defineField({name: 'platform', title: 'Serwis', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'url', title: 'Adres URL', type: 'url', validation: (rule) => rule.required()}),
    ]}]}),
    defineField({name: 'defaultSeo', title: 'Domyślne SEO', type: 'object', fields: [
      defineField({name: 'title', title: 'Tytuł', type: 'string'}),
      defineField({name: 'description', title: 'Opis', type: 'text', rows: 3}),
      defineField({name: 'image', title: 'Grafika', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', title: 'Tekst alternatywny', type: 'string'})]}),
    ]}),
    defineField({name: 'announcement', title: 'Ogłoszenie', type: 'object', fields: [
      defineField({name: 'enabled', title: 'Widoczne', type: 'boolean', initialValue: false}),
      defineField({name: 'title', title: 'Tytuł', type: 'string'}),
      defineField({name: 'message', title: 'Treść', type: 'text', rows: 3}),
    ]}),
    defineField({name: 'legal', title: 'Treści prawne', type: 'object', description: 'Teksty mogą pozostać puste w szkicu. Flaga zatwierdzenia jest bramką produkcyjną.', fields: [
      defineField({name: 'approved', title: 'Treści prawne zatwierdzone', type: 'boolean', initialValue: false, validation: (rule) => rule.required()}),
      defineField({name: 'privacy', title: 'Polityka prywatności', type: 'text', rows: 12}),
      defineField({name: 'terms', title: 'Regulamin', type: 'text', rows: 12}),
    ]}),
  ],
})
