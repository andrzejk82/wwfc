import {describe,expect,it} from 'vitest';
import {validateCandidate} from '../src/preflight';

const settings={_id:'site-settings',_type:'siteSettings',approved:false};
const coach={_id:'coach-one',_type:'coach',name:'Trainer',slug:{current:'trainer'}};
const discipline={_id:'discipline-one',_type:'discipline',name:'Boks',slug:{current:'boks'}};
const session={_key:'session-one',weekday:2,startTime:'18:00',endTime:'19:00',discipline:{_ref:'discipline-one'},coach:{_ref:'coach-one'},room:'mata-1',audience:'general',ageMin:null,ageMax:null,level:null};
const release={_id:'release-one',_type:'scheduleRelease',title:'September',validFrom:'2026-09-01',validTo:'2026-09-30',sessions:[session]};
const draft={...release,_id:'drafts.release-one',_rev:'rev-two'};
describe('server-side candidate preflight',()=>{
 it('overlays only the requested draft, preserving canonical reference IDs',async()=>{
  const unrelatedBadDraft={_id:'drafts.coach-one',_type:'coach',name:'',slug:{current:''}};
  await expect(validateCandidate([settings,coach,discipline,release,draft,unrelatedBadDraft],'release-one','rev-two')).resolves.toEqual({valid:true,documentId:'release-one',revision:'rev-two',validatedAt:expect.any(String)});
 });
 it('rejects draft room conflict against another published release',async()=>{
  const overlapping={...release,_id:'release-two'};
  await expect(validateCandidate([settings,coach,discipline,release,draft,overlapping],'release-one','rev-two')).rejects.toMatchObject({status:422,code:'invalid_content'});
 });
 it('rejects invalid times and unresolved references in the candidate',async()=>{
  for(const sessions of [[{...session,startTime:'25:00'}],[{...session,coach:{_ref:'missing'}}],[session,{...session,_key:'session-two',startTime:'18:30'}]])await expect(validateCandidate([settings,coach,discipline,release,{...draft,sessions}],'release-one','rev-two')).rejects.toMatchObject({status:422});
 });
 it('refuses stale revisions and absent drafts',async()=>{
  await expect(validateCandidate([settings,draft],'release-one','stale')).rejects.toMatchObject({status:409});
  await expect(validateCandidate([settings,release],'release-one','rev-two')).rejects.toMatchObject({status:404});
 });
});
