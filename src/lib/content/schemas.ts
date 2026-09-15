import { z } from 'zod';
import { addDays, occurrencesForDate } from '../schedule/schedule';

const date = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const slug = z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const room = z.enum(['mata-1','mata-2','salka','cardio']);
export const ClassSessionSchema = z.object({
 key:slug,weekday:z.number().int().min(1).max(7),startTime:time,endTime:time.nullable(),
 disciplineSlug:slug,coachSlug:slug,room,audience:z.enum(['general','children','women']),
 ageMin:z.number().int().min(0).max(100).nullable(),ageMax:z.number().int().min(0).max(100).nullable(),
 level:z.enum(['intro','beginner','mixed','intermediate','sparring']).nullable(),
 sortOrder:z.number().int(),archived:z.boolean(),sourceImage:z.url().optional(),
}).superRefine((s,c)=>{
 if(s.endTime && s.endTime<=s.startTime)c.addIssue({code:'custom',path:['endTime'],message:'Koniec musi być po początku.'});
 if(s.audience==='children' && s.ageMin===null)c.addIssue({code:'custom',path:['ageMin'],message:'Podaj minimalny wiek.'});
 if(s.ageMin!==null && s.ageMax!==null && s.ageMin>s.ageMax)c.addIssue({code:'custom',path:['ageMax'],message:'Nieprawidłowy zakres wieku.'});
});
export const SessionExceptionSchema=z.object({sessionKey:slug,date,kind:z.enum(['cancelled','changed']),explanation:z.string().trim().min(1),replacement:z.object({startTime:time.optional(),endTime:time.nullable().optional(),room:room.optional(),coachSlug:slug.optional()}).optional()}).refine(e=>e.kind!=='changed'||Boolean(e.replacement&&Object.keys(e.replacement).length),{message:'Zmiana wymaga wartości zastępczej.'});
export const NoticeSchema=z.object({key:slug,title:z.string().min(1),message:z.string(),startDate:date,endDate:date,closed:z.boolean()}).refine(n=>n.startDate<=n.endDate,{message:'Nieprawidłowy okres komunikatu.'});
export const ScheduleReleaseSchema=z.object({id:slug,title:z.string().min(1),validFrom:date,validTo:date.nullable(),sessions:z.array(ClassSessionSchema),exceptions:z.array(SessionExceptionSchema),notices:z.array(NoticeSchema)}).refine(r=>!r.validTo||r.validFrom<=r.validTo,{message:'Nieprawidłowy okres grafiku.'});
export type ClassSession=z.infer<typeof ClassSessionSchema>;
export type ScheduleRelease=z.infer<typeof ScheduleReleaseSchema>;
export type SessionException=z.infer<typeof SessionExceptionSchema>;

export function validateReleases(raw:unknown):ScheduleRelease[]{
 const releases=z.array(ScheduleReleaseSchema).parse(raw).sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
 const ids=new Set<string>();
 for(let i=0;i<releases.length;i++){
  const r=releases[i]!;const previous=releases[i-1];
  if(ids.has(r.id))throw new Error('Powtórzony identyfikator wersji.');ids.add(r.id);
  if(previous && (!previous.validTo || previous.validTo>=r.validFrom))throw new Error('Nakładające się okresy grafiku.');
  const keys=new Set(r.sessions.map(s=>s.key));if(keys.size!==r.sessions.length)throw new Error('Powtórzony klucz zajęć.');
  const exceptions=new Set<string>();
  for(const e of r.exceptions){
   const s=r.sessions.find(s=>s.key===e.sessionKey);const id=e.sessionKey+e.date;
   if(!s || e.date<r.validFrom || (r.validTo && e.date>r.validTo) || ((new Date(e.date+'T12:00:00Z').getUTCDay()||7)!==s.weekday))throw new Error('Wyjątek nie wskazuje daty istniejących zajęć.');
   if(exceptions.has(id))throw new Error('Powtórzony wyjątek.');exceptions.add(id);
   ClassSessionSchema.parse({...s,...e.replacement});
  }
  // Between event boundaries the schedule repeats weekly. Inspect a full week
  // after each boundary so a first-week cancellation cannot hide later conflicts.
  const boundaries=[r.validFrom,...r.exceptions.flatMap(e=>[e.date,addDays(e.date,1)]),...r.notices.flatMap(n=>[n.startDate,addDays(n.endDate,1)])];
  const sampleDates=new Set(boundaries.flatMap(d=>Array.from({length:7},(_,n)=>addDays(d,n))));
  for(const d of sampleDates){
   const active=occurrencesForDate([r],d).filter(o=>o.status!=='cancelled'&&o.effective.endTime);
   for(let a=0;a<active.length;a++)for(let b=a+1;b<active.length;b++){
    const x=active[a]!.effective,y=active[b]!.effective;
    if(x.room===y.room && x.startTime<y.endTime! && y.startTime<x.endTime!)throw new Error(`Konflikt sali ${x.room}: ${d}.`);
   }
  }
 }
 return releases;
}
