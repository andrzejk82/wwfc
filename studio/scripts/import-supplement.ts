import {readFile} from 'node:fs/promises'
import {getCliClient} from 'sanity/cli'
const client=getCliClient({apiVersion:'2026-09-01'}).withConfig({useCdn:false,perspective:'raw'})
if(client.config().projectId!=='objbb93c'||client.config().dataset!=='production')throw new Error('Nieprawidłowy projekt.')
const lines=await readFile(new URL('../../.cache/sanity-supplement.ndjson',import.meta.url),'utf8')
const documents=lines.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line))
if(documents.some(doc=>!doc._id.startsWith('drafts.')||!['priceGroup','pricingPage','faqItem'].includes(doc._type)))throw new Error('Nieprawidłowy suplement.')
const ids=documents.flatMap(doc=>[doc._id,doc._id.replace(/^drafts\./,'')])
const existing=await client.fetch<string[]>('*[_id in $ids]._id',{ids})
const missing=documents.filter(doc=>!existing.includes(doc._id)&&!existing.includes(doc._id.replace(/^drafts\./,'')))
if(missing.length){let transaction=client.transaction();for(const doc of missing)transaction=transaction.createIfNotExists(doc);await transaction.commit()}
const settings=await client.getDocument('drafts.site-settings')
if(settings&&!settings.openingHours){
 const supplement=JSON.parse(await readFile(new URL('../../.cache/sanity-settings-supplement.json',import.meta.url),'utf8'))
 await client.patch(settings._id).setIfMissing({openingHours:supplement.openingHours}).commit()
}
console.log(`Dodano ${missing.length} brakujących szkiców cennika/FAQ. Istniejące dokumenty i flagi zatwierdzenia zachowano.`)
