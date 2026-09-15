import { describe, expect, it } from 'vitest';
import { sourceContent, validateContent } from '../../src/lib/content/repository';
describe('public source import',()=>{
 it('preserves all 81 classes, unknown durations and open age ranges',()=>{
  const c=sourceContent();expect(c.releases[0]!.sessions).toHaveLength(81);
  expect(c.releases[0]!.sessions.every(s=>s.endTime===null)).toBe(true);
  expect(c.releases[0]!.sessions.some(s=>s.ageMin===11&&s.ageMax===null)).toBe(true);
  expect(c.releases[0]!.sessions.some(s=>s.room==='cardio')).toBe(true);
 });
 it('rejects dangling coach references and unapproved production content',()=>{
  const c=sourceContent();c.coaches=[];expect(()=>validateContent(c)).toThrow(/trenera/);
  expect(()=>validateContent(sourceContent(),true)).toThrow(/zatwierdz/);
 });
});
