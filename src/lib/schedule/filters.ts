import type { Occurrence } from './schedule';
import { days, levels, rooms, audiences } from './labels';
export interface ScheduleFilterState{week?:string;day?:number;discipline?:string;audience?:string;age?:number;level?:string;room?:string;coach?:string;}
export function parseFilters(params:URLSearchParams):ScheduleFilterState{
 const f:ScheduleFilterState={};
 const week=params.get('week');if(week&&/^\d{4}-\d{2}-\d{2}$/.test(week)){const d=new Date(week+'T12:00:00Z');if(!Number.isNaN(d.valueOf())&&d.toISOString().startsWith(week)&&d.getUTCDay()===1)f.week=week;}
 for(const key of ['day','age'] as const){const raw=params.get(key);if(raw&&/^\d+$/.test(raw)){const n=Number(raw);if(key==='day'&&n>=1&&n<=days.length)f.day=n;if(key==='age'&&n>=1&&n<=100)f.age=n;}}
 for(const key of ['discipline','coach'] as const){const value=params.get(key);if(value&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))f[key]=value;}
 for(const [key,values] of [['level',levels],['room',rooms],['audience',audiences]] as const){const v=params.get(key);if(v&&Object.hasOwn(values,v))f[key]=v;}
 return f;
}
export function serializeFilters(f:ScheduleFilterState):string{const p=new URLSearchParams();for(const [k,v] of Object.entries(f))if(v!==undefined&&v!=='')p.set(k,String(v));return p.toString();}
export function filterOccurrences(items:Occurrence[],f:ScheduleFilterState):Occurrence[]{return items.filter(({effective:s})=>(!f.day||s.weekday===f.day)&&(!f.discipline||s.disciplineSlug===f.discipline)&&(!f.coach||s.coachSlug===f.coach)&&(!f.room||s.room===f.room)&&(!f.level||s.level===f.level)&&(!f.audience||s.audience===f.audience)&&(f.age===undefined||(s.audience==='children'&&s.ageMin!==null&&f.age>=s.ageMin&&(s.ageMax===null||f.age<=s.ageMax))));}
