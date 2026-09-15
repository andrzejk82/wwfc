import { describe, expect, it } from 'vitest';
import { dateInWarsaw, weekdayInWarsaw, mondayOf, addDays, occurrencesForDate, occurrencesForWeek, upcomingToday, selectRelease } from '../../src/lib/schedule/schedule';
import { parseFilters, serializeFilters, filterOccurrences } from '../../src/lib/schedule/filters';
import { validateReleases, type ScheduleRelease } from '../../src/lib/content/schemas';

const release = (): ScheduleRelease => ({ id:'september', title:'Wrzesień', validFrom:'2026-09-01', validTo:'2026-09-30', sessions:[{ key:'boks', weekday:2, startTime:'18:00', endTime:'19:00', disciplineSlug:'boks', coachSlug:'jan', room:'mata-1', audience:'general', ageMin:null, ageMax:null, level:'intro', sortOrder:0, archived:false }], exceptions:[], notices:[] });
describe('calendar and dated schedule', () => {
 it('uses Warsaw day in summer and winter',()=>{
  expect(dateInWarsaw(new Date('2026-09-07T22:30:00Z'))).toBe('2026-09-08');
  expect(dateInWarsaw(new Date('2026-01-05T23:30:00Z'))).toBe('2026-01-06');
  expect(weekdayInWarsaw(new Date('2026-09-07T22:30:00Z'))).toBe(2);
 });
 it('moves calendar dates across DST and month boundaries',()=>{
  expect(addDays('2026-03-29',1)).toBe('2026-03-30');
  expect(addDays('2026-10-25',1)).toBe('2026-10-26');
  expect(mondayOf('2026-10-01')).toBe('2026-09-28');
 });
 it('changes only one occurrence and preserves its original',()=>{
  const r=release(); r.exceptions=[{sessionKey:'boks',date:'2026-09-15',kind:'changed',explanation:'Zastępstwo',replacement:{startTime:'19:00',endTime:'20:00'}}];
  const [o]=occurrencesForDate([r],'2026-09-15');
  expect(o?.original.startTime).toBe('18:00'); expect(o?.effective.startTime).toBe('19:00');
  expect(occurrencesForDate([r],'2026-09-22')[0]?.effective.startTime).toBe('18:00');
 });
 it('preserves cancellation in the full schedule but excludes it from upcoming',()=>{
  const r=release();r.exceptions=[{sessionKey:'boks',date:'2026-09-15',kind:'cancelled',explanation:'Odwołane'}];
  expect(occurrencesForDate([r],'2026-09-15')[0]?.status).toBe('cancelled');
  expect(upcomingToday([r],new Date('2026-09-15T12:00:00Z'))).toEqual([]);
 });
 it('closure wins over a replacement',()=>{
  const r=release();r.exceptions=[{sessionKey:'boks',date:'2026-09-15',kind:'changed',explanation:'Zmiana',replacement:{room:'mata-2'}}];
  r.notices=[{key:'closed',title:'Klub zamknięty',message:'Przerwa',startDate:'2026-09-15',endDate:'2026-09-15',closed:true}];
  expect(occurrencesForDate([r],'2026-09-15')[0]?.status).toBe('cancelled');
 });
 it('selects current, future, expired and missing coverage',()=>{
  const future={...release(),id:'october',validFrom:'2026-10-01',validTo:null};
  expect(selectRelease([release(),future],'2026-09-08').release?.id).toBe('september');
  expect(selectRelease([future],'2026-09-08').kind).toBe('future');
  expect(selectRelease([release()],'2026-10-01').kind).toBe('expired');
  expect(selectRelease([],'2026-09-08').kind).toBe('missing');
  expect(selectRelease([future],'2027-01-01').kind).toBe('active');
 });
 it('excludes started classes and handles release boundaries inside a week',()=>{
  expect(upcomingToday([release()],new Date('2026-09-15T16:00:00Z'))).toEqual([]);
  const future={...release(),id:'oct',validFrom:'2026-10-01',validTo:null,sessions:[{...release().sessions[0]!,weekday:4,startTime:'17:00'}]};
  expect(occurrencesForWeek([release(),future],'2026-09-28').map(o=>[o.date,o.effective.startTime])).toEqual([['2026-09-29','18:00'],['2026-10-01','17:00']]);
 });
});
describe('validation',()=>{
 it('detects a recurring conflict after the initial week is closed',()=>{
  const r=release();r.sessions.push({...r.sessions[0]!,key:'other',startTime:'18:30',endTime:'19:30'});
  r.notices=[{key:'closed',title:'Przerwa',message:'',startDate:'2026-09-01',endDate:'2026-09-07',closed:true}];
  expect(()=>validateReleases([r])).toThrow(/Konflikt sali/);
 });
 it('detects a recurring conflict masked by an exception in the first week',()=>{
  const r=release();r.sessions.push({...r.sessions[0]!,key:'other',startTime:'18:30',endTime:'19:30'});
  r.exceptions=[{sessionKey:'other',date:'2026-09-01',kind:'cancelled',explanation:'Odwołane'}];
  expect(()=>validateReleases([r])).toThrow(/Konflikt sali/);
 });
 it('accepts a conflict cancelled throughout the entire finite release',()=>{
  const r=release();r.validTo='2026-09-07';r.sessions.push({...r.sessions[0]!,key:'other',startTime:'18:30',endTime:'19:30'});
  r.exceptions=[{sessionKey:'other',date:'2026-09-01',kind:'cancelled',explanation:'Odwołane'}];
  expect(validateReleases([r])).toHaveLength(1);
 });
 it('accepts unknown duration and an open-ended age group without inventing an upper age',()=>{
  const r=release();r.validTo=null;r.sessions[0]={...r.sessions[0]!,endTime:null,audience:'children',ageMin:11,ageMax:null};
  expect(validateReleases([r])).toHaveLength(1);
 });
 it('rejects invalid times, calendar dates and overlapping releases',()=>{
  expect(()=>validateReleases([{...release(),validFrom:'2026-02-30'}])).toThrow();
  expect(()=>validateReleases([{...release(),sessions:[{...release().sessions[0]!,endTime:'17:00'}]}])).toThrow();
  expect(()=>validateReleases([release(),{...release(),id:'other'}])).toThrow();
 });
 it('rejects unknown, duplicate and wrong-day exceptions',()=>{
  const exception={sessionKey:'boks',date:'2026-09-15',kind:'cancelled' as const,explanation:'Odwołane'};
  expect(()=>validateReleases([{...release(),exceptions:[{...exception,sessionKey:'absent'}]}])).toThrow();
  expect(()=>validateReleases([{...release(),exceptions:[exception,exception]}])).toThrow();
  expect(()=>validateReleases([{...release(),exceptions:[{...exception,date:'2026-09-16'}]}])).toThrow();
 });
 it('rejects known room conflicts and accepts touching intervals',()=>{
  const r=release();r.sessions.push({...r.sessions[0]!,key:'other',startTime:'18:30',endTime:'19:30'});
  expect(()=>validateReleases([r])).toThrow();r.sessions[1]!.startTime='19:00';
  expect(validateReleases([r])).toHaveLength(1);
 });
});
describe('shareable filters',()=>{
 it('roundtrips filters and ignores bad values',()=>{
  const filters={week:'2026-09-14',day:2,discipline:'boks',level:'intro',age:11};
  expect(parseFilters(new URLSearchParams(serializeFilters(filters)))).toEqual(filters);
  expect(parseFilters(new URLSearchParams('day=99&age=-1&level=bad&week=2026-02-30'))).toEqual({});
 });
 it('filters the replacement room, not the original',()=>{
  const r=release();r.exceptions=[{sessionKey:'boks',date:'2026-09-15',kind:'changed',explanation:'Sala',replacement:{room:'mata-2'}}];
  const items=occurrencesForDate([r],'2026-09-15');
  expect(filterOccurrences(items,{room:'mata-2'})).toHaveLength(1);
  expect(filterOccurrences(items,{room:'mata-1'})).toHaveLength(0);
 });
});
