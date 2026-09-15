import { readFileSync } from 'node:fs';
import raw from '../../../data/source-schedule.json' with {type:'json'};
import { days } from '../schedule/labels';
import {validateContent,type Content} from './validation';

export {ContentSchema,validateContent,type Content,type SiteSettings,type Pricing,type FaqItem} from './validation';

export const slugify=(s:string)=>s.toLowerCase().replaceAll('ł','l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const descriptions:Record<string,string>={
 boks:'Praca nóg, technika ciosów i obrona. W grafiku znajdziesz grupy INTRO, początkujące i średniozaawansowane.',
 kickboxing:'Połącz techniki bokserskie z kopnięciami. Wybierz grupę dopasowaną do swojego doświadczenia.',
 'muay-thai':'Boks tajski. Zajęcia w grupach INTRO oraz dla początkujących.',
 mma:'Mieszane sztuki walki łączące stójkę, zapasy i parter. Sprawdź poziom oraz grupę wiekową w grafiku.',
 'bjj-gi':'Brazylijskie jiu-jitsu w kimonach. Poznaj techniki kontroli i walki w parterze.',
 'bjj-no-gi':'Brazylijskie jiu-jitsu bez kimona. W grafiku są również grupy INTRO i zajęcia dla kobiet.',
 zapasy:'Obalenia, kontrola i praca z partnerem. Zajęcia dla różnych grup wiekowych i poziomów.',
 akrobatyka:'Zajęcia ruchowe dla dzieci i młodzieży, z podziałem na grupy wiekowe.',
 westusie:'Zajęcia dla najmłodszych. Wybierz odpowiednią grupę wiekową z grafiku.',
 'trening-obwodowy':'Trening w strefie cardio prowadzony przez Eryka Murawskiego.',
 'stretching-mobility':'Zajęcia z rozciągania i mobilności dla kobiet i mężczyzn.',
 movement:'Zajęcia ruchowe prowadzone przez Dawida Gieranina.',
 'stojka-pod-mma':'Zajęcia ze stójki pod MMA prowadzone przez Bartosza Szewczyka.',
};
export function sourceContent():Content{
 const normalized=raw.sessions.map(s=>({...s,discipline:s.discipline.toLowerCase()==='muay thai'?'Muay Thai':/^bjj gi$/i.test(s.discipline)?'BJJ GI':/stretching/i.test(s.discipline)?'Stretching & mobility':s.discipline}));
 const sessions=normalized.map((s,i)=>{
  const ages=('ages' in s?String(s.ages):'').match(/\d+/g)?.map(Number)??[];
  const level='level' in s?s.level:undefined;
  const audience='audience' in s?s.audience:undefined;
  return {key:`session-${String(i+1).padStart(3,'0')}`,weekday:days.indexOf(s.weekday as typeof days[number])+1,startTime:s.startTime.padStart(5,'0'),endTime:null,disciplineSlug:slugify(s.discipline),coachSlug:slugify(s.coach),room:({'MATA 1':'mata-1','MATA 2':'mata-2','SALKA':'salka','STREFA CARDIO':'cardio'} as const)[s.room as 'MATA 1'],audience:audience==='dzieci'?'children' as const:audience==='kobiety'?'women' as const:'general' as const,ageMin:ages[0]??null,ageMax:ages[1]??null,level:level==='intro'?'intro' as const:level==='mix'?'mixed' as const:level?.startsWith('początkując')?'beginner' as const:level==='średniozaawansowana'?'intermediate' as const:null,sortOrder:i,archived:false,sourceImage:s.sourceImage};
 });
 const disciplines=[...new Set(normalized.map(s=>s.discipline))].map(name=>({name,slug:slugify(name),description:descriptions[slugify(name)]??'Sprawdź terminy i prowadzących w grafiku.'}));
 const coaches=[...new Set(normalized.map(s=>s.coach))].map(name=>({name,slug:slugify(name),description:`Prowadzi zajęcia: ${[...new Set(normalized.filter(s=>s.coach===name).map(s=>s.discipline))].join(', ')}.`,...(['Jarek Malinowski','Karolina Owczarz'].includes(name)?{image:`/images/${slugify(name)}.webp`}:{})}));
 return validateContent({schemaVersion:1,source:'source',retrievedOn:raw.retrievedOn,approved:false,legal:{approved:false,privacy:'',terms:''},settings:{clubName:'Warsaw West Fight Club',address:{street:contact.street,postalCode:'05-850',city:'Ożarów Mazowiecki'},phone:contact.phone,email:contact.email,openingHours:[{day:1,label:'Poniedziałek–piątek',hours:'7:00–22:00'},{day:6,label:'Sobota–niedziela',hours:'10:00–14:00'}],socialLinks:[],announcement:{enabled:false}},pricing:sourcePricing,faq:faq.map(([question,answer])=>({question,answer})),releases:[{id:'wrzesien-2026',title:raw.sourceSection,validFrom:'2026-09-01',validTo:null,sessions,exceptions:[],notices:[]}],disciplines,coaches});
}
export function getContent():Content{
 const path=process.env.CONTENT_SNAPSHOT_PATH;
 if(process.env.DEPLOY_ENV==='production'&&!path)throw new Error('Produkcja wymaga snapshotu.');
 return path?validateContent(JSON.parse(readFileSync(path,'utf8')),process.env.DEPLOY_ENV==='production'):sourceContent();
}
export const contact={phone:'+48 604 066 669',tel:'+48604066669',email:'biuro@wwfc.com.pl',street:'Strzykulska 6a',city:'05-850 Ożarów Mazowiecki'};
export const faq=[
 ['Czy muszę się zapisać?','Według informacji klubu na zajęcia grupowe można przyjść bez wcześniejszych zapisów. Jeśli potrzebujesz pomocy w wyborze grupy, zadzwoń do recepcji.'],
 ['Nigdy nie trenowałem. Od czego zacząć?','W grafiku wybierz poziom INTRO — od zera. Możesz też skontaktować się z recepcją, aby dobrać dyscyplinę i grupę.'],
 ['Co zabrać na pierwszy trening?','Wygodny strój sportowy, wodę i ręcznik. Wymagany sprzęt zależy od dyscypliny — przed pierwszą wizytą potwierdź go w recepcji.'],
 ['Czy są zajęcia dla dzieci?','Tak. Grafik zawiera konkretne grupy wiekowe, w tym Westusie dla najmłodszych. Użyj filtra wieku, aby znaleźć właściwą grupę.'],
 ['Czy są osobne grupy dla kobiet?','Tak, w grafiku są m.in. boks i BJJ No-Gi dla kobiet. Pozostałe zajęcia sprawdzisz w pełnym grafiku.'],
 ['Ile trwa trening?','Obecny grafik klubu podaje godziny rozpoczęcia. Czas trwania wybranych zajęć potwierdź w recepcji.'],
];
const sourcePricing={title:'Cennik',groups:[
 {name:'Dorośli',slug:'dorosli',rows:[['OPEN','280 zł'],['12 wejść','250 zł'],['8 wejść','220 zł'],['4 wejścia','180 zł']].map(([label,price])=>({label,price})),sortOrder:0},
 {name:'Dzieci do 18 lat',slug:'dzieci-do-18-lat',rows:[['OPEN','240 zł'],['12 wejść','220 zł'],['8 wejść','200 zł'],['4 wejścia','160 zł']].map(([label,price])=>({label,price})),sortOrder:1},
 {name:'Pozostałe opłaty',slug:'pozostale-oplaty',rows:[{label:'Jednorazowe wejście',price:'50 zł'},{label:'Wpisowe przed pierwszymi zajęciami',price:'50 zł'}],sortOrder:2},
],notes:['Cennik przepisany z grafiki na stronie WWFC, odczyt 08.09.2026. Źródło nie określa daty końcowej ani szczegółowych zasad karnetów. Potwierdzisz je w recepcji.']};
