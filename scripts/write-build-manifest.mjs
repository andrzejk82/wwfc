import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceContent} from '../src/lib/content/repository.ts';
import {createBuildManifest} from '../src/lib/build/manifest.ts';

export async function writeBuildManifest(env=process.env){
 const production=env.DEPLOY_ENV==='production';
 if(production&&(!env.CONTENT_SNAPSHOT_PATH||env.CONTENT_PERSPECTIVE==='drafts'||env.WWFC_TEST_NOW||env.TEST_NOW))throw new Error('Produkcja wymaga snapshotu published i rzeczywistego zegara.');
 await mkdir('.cache',{recursive:true});
 const path=resolve(env.CONTENT_SNAPSHOT_PATH||'.cache/content-source.json');
 if(!env.CONTENT_SNAPSHOT_PATH)await writeFile(path,JSON.stringify(sourceContent(),null,2)+'\n','utf8');
 const manifest=createBuildManifest(await readFile(path),{production,commit:env.GITHUB_SHA||'local'});
 await writeFile('.cache/build-manifest.json',JSON.stringify(manifest,null,2)+'\n','utf8');
 return {path,manifest};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await writeBuildManifest();
