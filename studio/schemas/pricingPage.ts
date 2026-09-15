import {defineField, defineType} from 'sanity'

export const pricingPage = defineType({
  name: 'pricingPage', title: 'Cennik', type: 'document',
  initialValue: {_id: 'pricing-page'},
  fields: [
    defineField({name: 'title', title: 'Tytuł', type: 'string', initialValue: 'Cennik', validation: (rule) => rule.required()}),
    defineField({name: 'groups', title: 'Grupy cenowe', type: 'array', of: [{type: 'reference', to: [{type: 'priceGroup'}]}]}),
    defineField({name: 'notes', title: 'Objaśnienia', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'paymentInformation', title: 'Informacje o płatności', type: 'text', rows: 4}),
  ],
})
