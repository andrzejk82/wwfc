import {getCliClient} from 'sanity/cli'
const client=getCliClient({apiVersion:'2026-09-01'}).withConfig({useCdn:false,perspective:'raw'})
if(client.config().projectId!=='objbb93c'||client.config().dataset!=='production')throw new Error('Nieprawidłowy projekt.')
const summary=await client.fetch(`{
 "drafts":count(*[_id in path("drafts.**")]),
 "published":count(*[!(_id in path("drafts.**")) && _type in ["siteSettings","scheduleRelease","coach","discipline","priceGroup","pricingPage","faqItem"]]),
 "sessions":count(*[_type=="scheduleRelease" && _id in path("drafts.**")].sessions[]),
 "priceGroups":count(*[_type=="priceGroup" && _id in path("drafts.**")]),
 "faq":count(*[_type=="faqItem" && _id in path("drafts.**")]),
 "coachPhotos":count(*[_type=="coach" && _id in path("drafts.**") && defined(image.asset->url)]),
 "approved":*[_id=="drafts.site-settings"][0].approved,
 "openingHours":count(*[_id=="drafts.site-settings"][0].openingHours)
}`)
console.log(JSON.stringify(summary))
