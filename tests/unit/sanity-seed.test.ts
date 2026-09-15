import {describe,expect,it} from 'vitest';
import {sourceContent} from '../../src/lib/content/repository';
import {prepareSanityDrafts} from '../../src/lib/content/sanity-seed';

describe('initial Sanity draft import',()=>{
 it('prepares all classes as drafts with deterministic IDs and resolvable draft references',()=>{
  const docs=prepareSanityDrafts(sourceContent());
  expect(docs.every(d=>d._id.startsWith('drafts.'))).toBe(true);
  expect(new Set(docs.map(d=>d._id)).size).toBe(docs.length);
  const release=docs.find(d=>d._type==='scheduleRelease')!;
  const sessions=release.sessions as Array<{_key:string;endTime:null;discipline:{_ref:string};coach:{_ref:string}}>;
  expect(sessions).toHaveLength(81);expect(new Set(sessions.map(s=>s._key)).size).toBe(81);
  for(const session of sessions){expect(session.endTime).toBeNull();expect(docs.some(d=>d._id==='drafts.'+session.coach._ref)).toBe(true);expect(docs.some(d=>d._id==='drafts.'+session.discipline._ref)).toBe(true);}
  expect(prepareSanityDrafts(sourceContent()).map(d=>d._id)).toEqual(docs.map(d=>d._id));
 });
 it('keeps approval off and does not turn local image paths into broken Sanity assets',()=>{
  const docs=prepareSanityDrafts(sourceContent());
  expect(docs.filter(d=>d._type==='coach').every(d=>!d.image)).toBe(true);
  expect(docs.find(d=>d._id==='drafts.site-settings')).toMatchObject({approved:false,legal:{approved:false}});
  expect(docs.find(d=>d._type==='scheduleRelease')?.publicationNote).toContain('zatwierdzenia');
 });
 it('includes editable pricing, FAQ and opening hours with stable array keys',()=>{
  const docs=prepareSanityDrafts(sourceContent());
  expect(docs.filter(d=>d._type==='priceGroup')).toHaveLength(3);
  expect(docs.filter(d=>d._type==='faqItem')).toHaveLength(6);
  expect(docs.find(d=>d._id==='drafts.pricing-page')).toBeDefined();
  const settings=docs.find(d=>d._id==='drafts.site-settings')!;
  expect(settings.openingHours).toEqual(expect.arrayContaining([expect.objectContaining({_key:expect.any(String),day:1})]));
 });
});
