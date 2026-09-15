import {validateContent,type Content} from './repository';

export type SeedDocument={_id:string;_type:string;[key:string]:unknown};
const reference=(type:'coach'|'discipline'|'priceGroup',slug:string)=>({_type:'reference',_ref:`${type}-${slug}`,_weak:true,_strengthenOnPublish:{type,template:{id:type}}});

// This only prepares data on disk. Importing requires an authenticated operator.
export function prepareSanityDrafts(raw:Content):SeedDocument[]{
 const content=validateContent(raw);
 if(content.source!=='source')throw new Error('Import początkowy jest przeznaczony wyłącznie dla danych źródłowych.');
 const documents:SeedDocument[]=[{
  _id:'drafts.site-settings',_type:'siteSettings',...content.settings,approved:false,
  openingHours:content.settings.openingHours.map((row,index)=>({...row,_type:'openingHoursRow',_key:`hours-${index+1}`})),
  socialLinks:content.settings.socialLinks.map((row,index)=>({...row,_type:'socialLink',_key:`social-${index+1}`})),
  legal:{approved:false,privacy:'',terms:''}
 }];
 if(content.pricing){
  for(const group of content.pricing.groups)documents.push({_id:`drafts.priceGroup-${group.slug}`,_type:'priceGroup',...group,slug:{_type:'slug',current:group.slug},rows:group.rows.map((row,index)=>({...row,_type:'priceRow',_key:`row-${index+1}`}))});
  documents.push({_id:'drafts.pricing-page',_type:'pricingPage',...content.pricing,groups:content.pricing.groups.map(group=>reference('priceGroup',group.slug))});
 }
 content.faq.forEach((item,index)=>documents.push({_id:`drafts.faq-source-${index+1}`,_type:'faqItem',...item,sortOrder:index}));
 for(const [collection,type] of [[content.disciplines,'discipline'],[content.coaches,'coach']] as const){
  for(const item of collection)documents.push({_id:`drafts.${type}-${item.slug}`,_type:type,name:item.name,slug:{_type:'slug',current:item.slug},description:item.description});
 }
 for(const release of content.releases){
  if(release.exceptions.length||release.notices.length)throw new Error('Dane importu początkowego wymagają osobnego przeglądu wyjątków i komunikatów.');
  documents.push({_id:`drafts.schedule-${release.id}`,_type:'scheduleRelease',title:release.title,validFrom:release.validFrom,validTo:release.validTo,publicationNote:`Dane z wwfc.com.pl, odczyt ${content.retrievedOn}. Do zatwierdzenia przez WWFC; brakujące godziny zakończenia nie zostały uzupełnione.`,
   sessions:release.sessions.map(({key,disciplineSlug,coachSlug,sourceImage,...session})=>({_type:'classSession',_key:key,...session,discipline:reference('discipline',disciplineSlug),coach:reference('coach',coachSlug)})),exceptions:[],notices:[]
  });
 }
 return documents;
}
