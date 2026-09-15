import {z} from 'zod';
import {ScheduleReleaseSchema,validateReleases} from './schemas';

const Slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const Named=z.object({slug:Slug,name:z.string().trim().min(1),description:z.string(),image:z.string().optional(),imageAlt:z.string().trim().min(1).optional()});
const Legal=z.object({approved:z.boolean(),privacy:z.string(),terms:z.string()});
const Settings=z.object({
 clubName:z.string().trim().min(1).optional(),
 address:z.object({street:z.string().trim().min(1).optional(),postalCode:z.string().trim().min(1).optional(),city:z.string().trim().min(1).optional()}).optional(),
 coordinates:z.object({lat:z.number(),lng:z.number()}).optional(),
 phone:z.string().trim().min(1).optional(),email:z.email().optional(),
 openingHours:z.array(z.object({day:z.number().int().min(1).max(7),label:z.string().trim().min(1),hours:z.string().trim().min(1)})).default([]),
 socialLinks:z.array(z.object({platform:z.string().trim().min(1),url:z.url()})).default([]),
 defaultSeo:z.object({title:z.string().optional(),description:z.string().optional(),image:z.string().optional(),imageAlt:z.string().trim().min(1).optional()}).optional(),
 announcement:z.object({enabled:z.boolean(),title:z.string().optional(),message:z.string().optional()}).default({enabled:false}),
});
const PriceRow=z.object({label:z.string().trim().min(1),price:z.string().trim().min(1),note:z.string().optional()});
const PriceGroup=z.object({name:z.string().trim().min(1),slug:Slug,description:z.string().optional(),rows:z.array(PriceRow),sortOrder:z.number().int()});
const Pricing=z.object({title:z.string().trim().min(1),groups:z.array(PriceGroup),notes:z.array(z.string()).default([]),paymentInformation:z.string().optional()});
const FaqItem=z.object({question:z.string().trim().min(1),answer:z.string().trim().min(1)});

export const ContentSchema=z.object({
 schemaVersion:z.literal(1),source:z.enum(['source','sanity']),perspective:z.enum(['published','drafts']).optional(),fetchedAt:z.iso.datetime().optional(),retrievedOn:z.iso.date(),approved:z.boolean(),legal:Legal,
 settings:Settings,pricing:Pricing.nullable(),faq:z.array(FaqItem),
 releases:z.array(ScheduleReleaseSchema),disciplines:z.array(Named),coaches:z.array(Named),
});
export type Content=z.infer<typeof ContentSchema>;
export type SiteSettings=Content['settings'];
export type Pricing=NonNullable<Content['pricing']>;
export type FaqItem=Content['faq'][number];

export function validateContent(value:unknown,production=false):Content{
 const c=ContentSchema.parse(value);
 const releases=validateReleases(c.releases);
 for(const collection of [c.coaches,c.disciplines])if(new Set(collection.map(x=>x.slug)).size!==collection.length)throw new Error('Powtórzony slug treści.');
 for(const r of releases)for(const s of r.sessions){
  if(!c.coaches.some(x=>x.slug===s.coachSlug))throw new Error('Brak trenera dla zajęć.');
  if(!c.disciplines.some(x=>x.slug===s.disciplineSlug))throw new Error('Brak dyscypliny dla zajęć.');
 }
 for(const r of releases)for(const e of r.exceptions){const coachSlug=e.replacement?.coachSlug;if(coachSlug&&!c.coaches.some(x=>x.slug===coachSlug))throw new Error('Brak trenera zastępującego.');}
 if(production&&(!c.approved||c.source!=='sanity'||!c.legal.approved||!c.legal.privacy.trim()||!c.legal.terms.trim()))throw new Error('Produkcja wymaga zatwierdzonych treści Sanity i dokumentów prawnych.');
 if(production&&(c.perspective!=='published'||!c.fetchedAt))throw new Error('Produkcja wymaga snapshotu published z datą pobrania.');
 const {clubName,address,phone,email,openingHours}=c.settings;
 if(production&&(!clubName||!address?.street||!address.postalCode||!address.city||!phone||!email||openingHours.length===0))throw new Error('Produkcja wymaga kompletnych danych kontaktowych klubu.');
 return {...c,releases};
}
