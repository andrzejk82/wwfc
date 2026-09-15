import type {StructureResolver} from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], title: string, schemaType: string, documentId: string) =>
  S.listItem().title(title).child(S.document().schemaType(schemaType).documentId(documentId).title(title))

export const polishStructure: StructureResolver = (S) => S.list()
  .title('Treści WWFC')
  .items([
    singleton(S, 'Ustawienia klubu', 'siteSettings', 'site-settings'),
    singleton(S, 'Cennik', 'pricingPage', 'pricing-page'),
    S.divider(),
    S.documentTypeListItem('scheduleRelease').title('Wersje grafiku'),
    S.documentTypeListItem('discipline').title('Dyscypliny'),
    S.documentTypeListItem('coach').title('Trenerzy'),
    S.documentTypeListItem('priceGroup').title('Grupy cenowe'),
    S.documentTypeListItem('faqItem').title('Pytania i odpowiedzi'),
  ])
