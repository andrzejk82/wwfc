import {describe,expect,it} from 'vitest';
import {sourceContent,validateContent} from '../../src/lib/content/repository';
import {validateContent as validatePureContent} from '../../src/lib/content/validation';
import {fetchSanityContent,normalizeSanityResponse,sanityReadConfig} from '../../src/lib/content/sanity';
import {parse,evaluate} from 'groq-js';
import {prepareSanityDrafts,type SeedDocument} from '../../src/lib/content/sanity-seed';

const response=()=>{
 const c=sourceContent();
 return {settings:{approved:false,legal:c.legal,...c.settings},pricing:c.pricing,faq:c.faq,releases:c.releases,coaches:c.coaches,disciplines:c.disciplines};
};
describe('Sanity content connection',()=>{
 it('projects real Sanity-shaped documents, references and one-date replacements through GROQ',async()=>{
  const dataset:SeedDocument[]=prepareSanityDrafts(sourceContent()).map(d=>({...d,_id:d._id.replace(/^drafts\./,'')}));
  const release=dataset.find(d=>d._type==='scheduleRelease')!;
  const sessions=release.sessions as Array<{_key:string;weekday:number}>;
  const tuesday=sessions.find(s=>s.weekday===2)!;
  release.exceptions=[{_key:'exception-1',_type:'sessionException',sessionKey:tuesday._key,date:'2026-09-15',kind:'changed',explanation:'Zastępstwo',replacement:{coach:{_type:'reference',_ref:'coach-jarek-malinowski'},room:'salka',endTimeUnknown:true}}];
  const coach=dataset.find(d=>d._id==='coach-jarek-malinowski')!;
  coach.image={asset:{_type:'reference',_ref:'image-test'},alt:'Trener na sali'};
  dataset.push({_id:'image-test',_type:'sanity.imageAsset',url:'https://cdn.sanity.io/images/objbb93c/production/example.jpg'});
  for(let i=dataset.length-1;i>=0;i--)if(['pricingPage','priceGroup','faqItem'].includes(dataset[i]!._type))dataset.splice(i,1);
  Object.assign(dataset.find(d=>d._id==='site-settings')!,{approved:true,clubName:'Warsaw West Fight Club',address:{street:'Strzykulska 6a',postalCode:'05-850',city:'Ożarów Mazowiecki'},coordinates:{lat:52.208,lng:20.797},phone:'+48 604 066 669',email:'biuro@wwfc.com.pl',openingHours:[{_key:'mon',day:1,label:'Poniedziałek',hours:'7:00–22:00'}],socialLinks:[{_key:'ig',platform:'Instagram',url:'https://www.instagram.com/wwfc'}],defaultSeo:{title:'WWFC',description:'Klub sportów walki',image:{asset:{_type:'reference',_ref:'image-seo'},alt:'Zawodnicy WWFC'}},announcement:{enabled:true,title:'Zmiana godzin',message:'Sprawdź grafik.'},legal:{approved:true,privacy:'Polityka',terms:'Regulamin'}});
  dataset.push(
   {_id:'image-seo',_type:'sanity.imageAsset',url:'https://cdn.sanity.io/images/objbb93c/production/seo.jpg'},
   {_id:'price-adults',_type:'priceGroup',name:'Dorośli',slug:{current:'dorosli'},description:'Karnety dla dorosłych',rows:[{_key:'open',label:'OPEN',price:'280 zł',note:'Miesięcznie'}],sortOrder:2},
   {_id:'price-kids',_type:'priceGroup',name:'Dzieci',slug:{current:'dzieci'},rows:[{_key:'four',label:'4 wejścia',price:'160 zł'}],sortOrder:1},
   {_id:'pricing-page',_type:'pricingPage',title:'Cennik WWFC',groups:[{_type:'reference',_ref:'price-adults'},{_type:'reference',_ref:'price-kids'}],notes:['Karnet jest imienny.'],paymentInformation:'Zapytaj w recepcji.'},
   {_id:'faq-2',_type:'faqItem',question:'Co zabrać?',answer:'Strój i wodę.',sortOrder:2},
   {_id:'faq-1',_type:'faqItem',question:'Jak zacząć?',answer:'Wybierz grupę INTRO.',sortOrder:1},
  );
  const snapshot=await fetchSanityContent(async query=>(await evaluate(parse(query),{dataset})).get());
  expect(snapshot.releases[0]!.sessions).toHaveLength(81);
  expect(snapshot.releases[0]!.exceptions[0]!.replacement).toEqual({coachSlug:'jarek-malinowski',room:'salka',endTime:null});
  expect(snapshot.coaches.find(c=>c.slug==='jarek-malinowski')).toMatchObject({imageAlt:'Trener na sali',image:'https://cdn.sanity.io/images/objbb93c/production/example.jpg?w=640&h=640&fit=crop&auto=format'});
  expect(snapshot.settings).toMatchObject({clubName:'Warsaw West Fight Club',phone:'+48 604 066 669',address:{postalCode:'05-850'},defaultSeo:{image:'https://cdn.sanity.io/images/objbb93c/production/seo.jpg?w=1200&h=630&fit=crop&auto=format',imageAlt:'Zawodnicy WWFC'},announcement:{enabled:true}});
  expect(snapshot.pricing).toMatchObject({title:'Cennik WWFC',groups:[{slug:'dzieci',rows:[{label:'4 wejścia',price:'160 zł'}]},{slug:'dorosli'}],notes:['Karnet jest imienny.'],paymentInformation:'Zapytaj w recepcji.'});
  expect(snapshot.faq).toEqual([{question:'Jak zacząć?',answer:'Wybierz grupę INTRO.'},{question:'Co zabrać?',answer:'Strój i wodę.'}]);
 });
 it('normalizes sparse projected documents without converting optional fields into source defaults',async()=>{
  const dataset:SeedDocument[]=prepareSanityDrafts(sourceContent()).map(d=>({...d,_id:d._id.replace(/^drafts\./,'')}));
  for(let i=dataset.length-1;i>=0;i--)if(['pricingPage','priceGroup','faqItem'].includes(dataset[i]!._type))dataset.splice(i,1);
  const settings=dataset.find(d=>d._id==='site-settings')!;
  for(const field of ['coordinates','openingHours','socialLinks','defaultSeo','announcement'])delete settings[field];
  const snapshot=await fetchSanityContent(async query=>(await evaluate(parse(query),{dataset})).get(),'2026-09-14T12:00:00Z');
  expect(snapshot.settings).toMatchObject({clubName:'Warsaw West Fight Club',openingHours:[],socialLinks:[],announcement:{enabled:false}});
  expect(snapshot.settings.coordinates).toBeUndefined();
  expect(snapshot.pricing).toBeNull();
  expect(snapshot.faq).toEqual([]);
 });
 it('reads one complete snapshot and preserves future releases and unknown durations',async()=>{
  const raw=response();raw.releases[0]!.validTo='2026-09-30';raw.releases.push({...raw.releases[0]!,id:'october',validFrom:'2026-10-01',validTo:null});
  let calls=0;
  const snapshot=await fetchSanityContent(async()=>{calls++;return raw;},'2026-09-11T12:00:00Z');
  expect(calls).toBe(1);expect(snapshot.source).toBe('sanity');expect(snapshot.perspective).toBe('published');
  expect(snapshot.releases).toHaveLength(2);expect(snapshot.releases[1]!.sessions[0]!.endTime).toBeNull();
  expect(snapshot.fetchedAt).toBe('2026-09-11T12:00:00Z');
 });
 it('rejects missing settings instead of inventing a complete CMS snapshot',async()=>{
  await expect(fetchSanityContent(async()=>({...response(),settings:null}))).rejects.toThrow(/ustawień/);
 });
 it('rejects unresolved references and overlapping release periods',async()=>{
  const dangling=response();dangling.coaches=[];
  await expect(fetchSanityContent(async()=>dangling)).rejects.toThrow(/trenera/);
  const overlap=response();overlap.releases.push({...overlap.releases[0]!,id:'overlap'});
  await expect(fetchSanityContent(async()=>overlap)).rejects.toThrow(/okresy/);
 });
 it('accepts an empty schedule when settings exist',async()=>{
  await expect(fetchSanityContent(async()=>({...response(),releases:[]}))).resolves.toMatchObject({releases:[]});
 });
 it('uses the uncached published perspective and refuses unsupported draft mode',()=>{
  expect(sanityReadConfig({SANITY_PROJECT_ID:'objbb93c',SANITY_DATASET:'production'})).toMatchObject({projectId:'objbb93c',dataset:'production',perspective:'published',useCdn:false});
  expect(()=>sanityReadConfig({SANITY_PROJECT_ID:'objbb93c',SANITY_DATASET:'production',CONTENT_PERSPECTIVE:'drafts'})).toThrow(/szkic/);
  expect(()=>sanityReadConfig({SANITY_PROJECT_ID:'objbb93c',SANITY_DATASET:'production',CONTENT_PERSPECTIVE:'drafts',DEPLOY_ENV:'production',DRAFT_PREVIEW_PROTECTION_VERIFIED:'true',SANITY_API_READ_TOKEN:'secret'})).toThrow(/szkic/);
  expect(sanityReadConfig({SANITY_PROJECT_ID:'objbb93c',SANITY_DATASET:'production',CONTENT_PERSPECTIVE:'drafts',DEPLOY_ENV:'draft-preview',DRAFT_PREVIEW_PROTECTION_VERIFIED:'true',SANITY_API_READ_TOKEN:'secret'})).toMatchObject({perspective:'drafts',token:'secret'});
 });
 it('does not let a draft snapshot pass the production gate',()=>{
  const c={...sourceContent(),source:'sanity',approved:true,legal:{approved:true,privacy:'Test privacy',terms:'Test terms'},perspective:'drafts',fetchedAt:'2026-09-11T12:00:00Z'};
  expect(()=>validateContent(c,true)).toThrow(/published/);
  expect(()=>validateContent({...c,perspective:'published'},true)).not.toThrow();
 });
 it('normalizes typed draft metadata without weakening the production gate',()=>{
  const raw=response();raw.settings.approved=true;raw.settings.legal={approved:true,privacy:'Polityka',terms:'Regulamin'};
  const snapshot=normalizeSanityResponse(raw,{perspective:'drafts',fetchedAt:'2026-09-14T12:00:00Z'});
  expect(snapshot).toMatchObject({source:'sanity',perspective:'drafts',fetchedAt:'2026-09-14T12:00:00Z',retrievedOn:'2026-09-14'});
  expect(()=>validateContent(snapshot,true)).toThrow(/published/);
 });
 it('does not fill missing Sanity contact or pricing fields from source content',()=>{
  const raw={...response(),settings:{approved:false,legal:{approved:false}},pricing:null,faq:[]};
  const snapshot=normalizeSanityResponse(raw,{perspective:'published',fetchedAt:'2026-09-14T12:00:00Z'});
  expect(snapshot.settings).toEqual({openingHours:[],socialLinks:[],announcement:{enabled:false}});
  expect(snapshot.pricing).toBeNull();
  expect(snapshot.faq).toEqual([]);
 });
 it('keeps validation pure and requires meaningful contact details for production',()=>{
  const raw=response();
  const before=structuredClone(raw);
  validatePureContent(normalizeSanityResponse(raw,{perspective:'published',fetchedAt:'2026-09-14T12:00:00Z'}));
  expect(raw).toEqual(before);
  const incomplete={...sourceContent(),source:'sanity',perspective:'published',fetchedAt:'2026-09-14T12:00:00Z',approved:true,legal:{approved:true,privacy:'P',terms:'R'},settings:{openingHours:[],socialLinks:[],announcement:{enabled:false}}};
  expect(()=>validatePureContent(incomplete,true)).toThrow(/kontaktowych/);
 });
});
