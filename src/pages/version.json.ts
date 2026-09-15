import {readFileSync} from 'node:fs';
import {BuildManifestSchema} from '../lib/build/manifest';
export function GET(){
 const manifest=BuildManifestSchema.parse(JSON.parse(readFileSync('.cache/build-manifest.json','utf8')));
 if(process.env.DEPLOY_ENV==='production'&&manifest.source!=='published')throw new Error('Produkcja nie może udostępniać manifestu szkiców lub fixture.');
 return new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
