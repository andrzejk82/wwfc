import {createHash} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function artifactDigest(root:string):Promise<string>{
 const files:Array<[string,string]>=[];
 async function walk(directory:string,prefix=''){
  for(const entry of await readdir(directory,{withFileTypes:true})){
   const path=join(directory,entry.name),name=prefix+entry.name;
   if(entry.isSymbolicLink())throw new Error('Artefakt nie może zawierać dowiązań.');
   if(entry.isDirectory())await walk(path,name+'/');
   else if(entry.isFile())files.push([name,createHash('sha256').update(await readFile(path)).digest('hex')]);
   else throw new Error('Nieobsługiwany wpis w artefakcie.');
  }
 }
 await walk(root);files.sort(([a],[b])=>a<b?-1:a>b?1:0);
 if(!files.length)throw new Error('Pusty artefakt.');
 return createHash('sha256').update(JSON.stringify(files)).digest('hex');
}
