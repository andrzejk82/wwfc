import {z} from 'zod';
import {validateContent,type Content} from './validation';

// A single request gives the build a consistent view of published documents.
export const SANITY_CONTENT_QUERY=`{
 "settings": *[_type == "siteSettings" && _id == "site-settings"][0]{
   approved, clubName, defined(address) => {address}, defined(coordinates) => {coordinates}, phone, email,
   "openingHours": coalesce(openingHours, [])[]{day, label, hours},
   "socialLinks": coalesce(socialLinks, [])[]{platform, url},
   defined(defaultSeo) => {"defaultSeo": defaultSeo{title, description, defined(image.asset) => {"image": image.asset->url + "?w=1200&h=630&fit=crop&auto=format", "imageAlt": image.alt}}},
   defined(announcement) => {announcement}, legal
 },
 "pricing": *[_type == "pricingPage" && _id == "pricing-page"][0]{
   title, "groups": groups[]->{name, "slug": slug.current, defined(description) => {description}, "rows": coalesce(rows, [])[]{label, price, defined(note) => {note}}, "sortOrder": coalesce(sortOrder, 0)} | order(sortOrder),
   "notes": coalesce(notes, []), defined(paymentInformation) => {paymentInformation}
 },
 "faq": *[_type == "faqItem"] | order(sortOrder, question){question, answer},
 "disciplines": *[_type == "discipline"] | order(name){
   name, "slug": slug.current, "description": coalesce(description, ""),
   defined(image.asset) => {"image": image.asset->url + "?w=640&h=640&fit=crop&auto=format", "imageAlt": image.alt}
 },
 "coaches": *[_type == "coach"] | order(name){
   name, "slug": slug.current, "description": coalesce(description, ""),
   defined(image.asset) => {"image": image.asset->url + "?w=640&h=640&fit=crop&auto=format", "imageAlt": image.alt}
 },
 "releases": *[_type == "scheduleRelease"] | order(validFrom){
   "id": _id, title, validFrom, validTo,
   "sessions": coalesce(sessions, [])[]{
     "key": _key, weekday, startTime, endTime,
     "disciplineSlug": discipline->slug.current, "coachSlug": coach->slug.current,
     room, audience, ageMin, ageMax, level,
     "sortOrder": coalesce(sortOrder, 0), "archived": coalesce(archived, false)
   },
   "exceptions": coalesce(exceptions, [])[]{
     sessionKey, date, kind, explanation,
     defined(replacement) => {"replacement": replacement{
       ..., defined(coach) => {"coachSlug": coach->slug.current}, endTimeUnknown == true => {"endTime": null}
     }}
   },
   "notices": coalesce(notices, [])[]{"key": _key, title, "message": coalesce(message, ""), startDate, endDate, "closed": coalesce(closed, false)}
 }
}`;

export function sanityReadConfig(env:Record<string,string|undefined>){
 const projectId=env.SANITY_PROJECT_ID;
 const dataset=env.SANITY_DATASET;
 if(!projectId||!/^[a-z0-9]+$/.test(projectId))throw new Error('Ustaw poprawne SANITY_PROJECT_ID.');
 if(!dataset||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset))throw new Error('Ustaw poprawne SANITY_DATASET.');
 const perspective=env.CONTENT_PERSPECTIVE??'published';
 if(perspective!=='published'&&perspective!=='drafts')throw new Error('Nieobsługiwana perspektywa treści.');
 if(perspective==='drafts'&&(env.DEPLOY_ENV!=='draft-preview'||env.DRAFT_PREVIEW_PROTECTION_VERIFIED!=='true'||!env.SANITY_API_READ_TOKEN))throw new Error('Podgląd szkiców wymaga chronionej ścieżki i tokenu odczytu.');
 return {projectId,dataset,apiVersion:'2026-09-01',useCdn:false,perspective,token:env.SANITY_API_READ_TOKEN||undefined};
}

const ResponseSchema=z.object({
 settings:z.object({
  approved:z.boolean().nullish(),clubName:z.string().nullish(),address:z.unknown().nullish(),coordinates:z.unknown().nullish(),phone:z.string().nullish(),email:z.string().nullish(),
  openingHours:z.array(z.unknown()).optional(),socialLinks:z.array(z.unknown()).optional(),defaultSeo:z.unknown().nullish(),announcement:z.unknown().nullish(),
  legal:z.object({approved:z.boolean().nullish(),privacy:z.string().nullish(),terms:z.string().nullish()}).nullish(),
 }).nullable(),
 pricing:z.unknown().nullish(),faq:z.array(z.unknown()).optional(),releases:z.array(z.unknown()),coaches:z.array(z.unknown()),disciplines:z.array(z.unknown())
});

export interface SanityContentMetadata{perspective:'published'|'drafts';fetchedAt:string;}

export function normalizeSanityResponse(raw:unknown,metadata:SanityContentMetadata):Content{
 const result=ResponseSchema.parse(raw);
 if(!result.settings)throw new Error('Brak opublikowanych ustawień klubu (site-settings) w Sanity. Uzupełnij je w panelu; poprzedni snapshot pozostaje bez zmian.');
 return validateContent({
   schemaVersion:1,source:'sanity',perspective:metadata.perspective,fetchedAt:metadata.fetchedAt,retrievedOn:metadata.fetchedAt.slice(0,10),
   approved:result.settings.approved??false,
   legal:{approved:result.settings.legal?.approved??false,privacy:result.settings.legal?.privacy??'',terms:result.settings.legal?.terms??''},
   settings:{clubName:result.settings.clubName??undefined,address:result.settings.address??undefined,coordinates:result.settings.coordinates??undefined,phone:result.settings.phone??undefined,email:result.settings.email??undefined,openingHours:result.settings.openingHours??[],socialLinks:result.settings.socialLinks??[],defaultSeo:result.settings.defaultSeo??undefined,announcement:result.settings.announcement??{enabled:false}},
   pricing:result.pricing??null,faq:result.faq??[],releases:result.releases,coaches:result.coaches,disciplines:result.disciplines
 });
}

export async function fetchSanityContent(fetcher:(query:string)=>Promise<unknown>,fetchedAt=new Date().toISOString(),metadata:{perspective:'published'|'drafts'}={perspective:'published'}){
 return normalizeSanityResponse(await fetcher(SANITY_CONTENT_QUERY),{fetchedAt,perspective:metadata.perspective});
}
