import {it,expect} from 'vitest';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {artifactDigest} from '../../src/lib/build/artifact-integrity';
it('detects changed, added and removed deployment files after testing',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wwfc-artifact-'));
 try{
  await writeFile(join(root,'index.html'),'original');const initial=await artifactDigest(root);
  expect(await artifactDigest(root)).toBe(initial);
  await writeFile(join(root,'index.html'),'changed');expect(await artifactDigest(root)).not.toBe(initial);
  await writeFile(join(root,'index.html'),'original');await writeFile(join(root,'extra.js'),'added');expect(await artifactDigest(root)).not.toBe(initial);
  await rm(join(root,'index.html'));expect(await artifactDigest(root)).not.toBe(initial);
 }finally{if(resolve(root).startsWith(resolve(tmpdir())+String.raw`\wwfc-artifact-`)||resolve(root).startsWith(resolve(tmpdir())+'/wwfc-artifact-'))await rm(root,{recursive:true});}
});
