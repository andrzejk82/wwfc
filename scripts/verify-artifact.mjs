import {readFile,writeFile} from 'node:fs/promises';
import {assertArtifactManifest} from '../src/lib/build/manifest.ts';
import {artifactDigest} from '../src/lib/build/artifact-integrity.ts';
const expected=JSON.parse(await readFile('.cache/build-manifest.json','utf8'));
const actual=JSON.parse(await readFile('dist/version.json','utf8'));
const snapshot=await readFile(process.env.CONTENT_SNAPSHOT_PATH||'.cache/content-source.json');
assertArtifactManifest(expected,actual,snapshot);
await writeFile('.cache/artifact-seal.json',JSON.stringify({digest:await artifactDigest('dist')}));
console.log('Artefakt odpowiada zweryfikowanemu snapshotowi i manifestowi.');
