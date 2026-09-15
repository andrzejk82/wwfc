import type { ClassSession, ScheduleRelease } from '../content/schemas';
export type Occurrence={id:string;releaseId:string;sessionKey:string;date:string;status:'active'|'cancelled'|'changed';explanation:string;original:ClassSession;effective:ClassSession};
export function dateInWarsaw(now:Date):string{
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k)!.value).join('-');
}
export function addDays(date:string,amount:number):string{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
export function dayOf(date:string):number{return new Date(date+'T12:00:00Z').getUTCDay()||7;}
export function weekdayInWarsaw(now:Date):number{return dayOf(dateInWarsaw(now));}
export function mondayOf(date:string):string{return addDays(date,1-dayOf(date));}
export function selectRelease(releases:ScheduleRelease[],date:string):{kind:'active'|'expired'|'future'|'missing';release:ScheduleRelease|null}{
 const active=releases.filter(r=>r.validFrom<=date&&(!r.validTo||r.validTo>=date));
 if(active.length>1)throw new Error('Nakładające się okresy grafiku.');
 if(active[0])return {kind:'active',release:active[0]};
 const sorted=[...releases].sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
 if(!sorted.length)return {kind:'missing',release:null};
 if(date<sorted[0]!.validFrom)return {kind:'future',release:sorted[0]!};
 if(sorted.every(r=>r.validTo&&r.validTo<date))return {kind:'expired',release:sorted.at(-1)!};
 return {kind:'missing',release:null};
}
export function occurrencesForDate(releases:ScheduleRelease[],date:string):Occurrence[]{
 const state=selectRelease(releases,date);if(state.kind!=='active'||!state.release)return [];
 const r=state.release;const closure=r.notices.find(n=>n.closed&&n.startDate<=date&&n.endDate>=date);
 return r.sessions.filter(s=>!s.archived&&s.weekday===dayOf(date)).map(s=>{
  const e=r.exceptions.find(e=>e.sessionKey===s.key&&e.date===date);
  return {id:`${r.id}-${s.key}-${date}`,releaseId:r.id,sessionKey:s.key,date,status:closure?'cancelled':e?.kind??'active',explanation:closure?`${closure.title}: ${closure.message}`:e?.explanation??'',original:s,effective:{...s,...e?.replacement}} as Occurrence;
 }).sort((a,b)=>a.effective.startTime.localeCompare(b.effective.startTime)||a.effective.sortOrder-b.effective.sortOrder);
}
export function occurrencesForWeek(releases:ScheduleRelease[],monday:string):Occurrence[]{return Array.from({length:7},(_,i)=>occurrencesForDate(releases,addDays(monday,i))).flat();}
export function upcomingToday(releases:ScheduleRelease[],now:Date,limit=3):Occurrence[]{
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 return occurrencesForDate(releases,dateInWarsaw(now)).filter(o=>o.status!=='cancelled'&&o.effective.startTime>time).slice(0,limit);
}
