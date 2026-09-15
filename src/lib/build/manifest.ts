import {createHash} from 'node:crypto';
import {z} from 'zod';
import {validateContent} from '../content/validation';

export const BuildManifestSchema=z.object({
 schemaVersion:z.literal(1),source:z.enum(['fixture','published','drafts']),
 snapshotHash:z.string().regex(/^[a-f0-9]{64}$/),sourceCommit:z.string().min(1).max(80),builtAt:z.iso.datetime()
}).strict();
export type BuildManifest=z.infer<typeof BuildManifestSchema>;
export const snapshotHash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
export function createBuildManifest(bytes:string|Buffer,options:{commit:string;builtAt?:string;production?:boolean}):BuildManifest{
 const content=validateContent(JSON.parse(bytes.toString()),options.production);
 if(options.production&&!/^[a-f0-9]{40}$/.test(options.commit))throw new Error('Produkcja wymaga pełnego identyfikatora commit.');
 const source=content.source==='source'?'fixture':content.perspective;
 return BuildManifestSchema.parse({schemaVersion:1,source,snapshotHash:snapshotHash(bytes),sourceCommit:options.commit,builtAt:options.builtAt??new Date().toISOString()});
}
export function assertArtifactManifest(expected:unknown,actual:unknown,bytes:string|Buffer){
 const a=BuildManifestSchema.parse(expected),b=BuildManifestSchema.parse(actual);
 if(a.snapshotHash!==snapshotHash(bytes)||Object.keys(a).some(key=>a[key as keyof BuildManifest]!==b[key as keyof BuildManifest]))throw new Error('Artefakt nie odpowiada sprawdzonemu snapshotowi i manifestowi.');
}
