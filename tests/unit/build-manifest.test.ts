import {describe,it,expect} from 'vitest';
import {sourceContent} from '../../src/lib/content/repository';
import {createBuildManifest,assertArtifactManifest} from '../../src/lib/build/manifest';

describe('verified build identity',()=>{
 it('hashes exact snapshot bytes and never treats source data as published',()=>{
  const content=sourceContent();const bytes=JSON.stringify(content);
  const a=createBuildManifest(bytes,{commit:'local',builtAt:'2026-09-14T10:00:00Z'});
  const b=createBuildManifest(bytes+'\n',{commit:'local',builtAt:'2026-09-14T10:00:00Z'});
  expect(a.source).toBe('fixture');expect(a.snapshotHash).not.toBe(b.snapshotHash);
  expect(()=>createBuildManifest(bytes,{commit:'a'.repeat(40),production:true})).toThrow();
 });
 it('requires approval, a published perspective and a real commit for production',()=>{
  const c={...sourceContent(),source:'sanity',perspective:'published',fetchedAt:'2026-09-14T10:00:00Z',approved:true,legal:{approved:true,privacy:'Tekst prywatności',terms:'Tekst regulaminu'}};
  const valid=JSON.stringify(c);const commit='a'.repeat(40);
  expect(createBuildManifest(valid,{commit,production:true}).source).toBe('published');
  expect(()=>createBuildManifest(JSON.stringify({...c,perspective:'drafts'}),{commit,production:true})).toThrow();
  expect(()=>createBuildManifest(valid,{commit:'local',production:true})).toThrow(/commit/i);
 });
 it('rejects another artifact or snapshot after verification',()=>{
  const bytes=JSON.stringify(sourceContent());const manifest=createBuildManifest(bytes,{commit:'local'});
  expect(()=>assertArtifactManifest(manifest,manifest,bytes)).not.toThrow();
  expect(()=>assertArtifactManifest(manifest,{...manifest,sourceCommit:'other'},bytes)).toThrow();
  expect(()=>assertArtifactManifest(manifest,manifest,bytes+' ')).toThrow();
 });
});
