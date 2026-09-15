import {mkdir,rename,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createClient} from '@sanity/client';
import {fetchSanityContent,sanityReadConfig} from '../src/lib/content/sanity.ts';

try {
 const config=sanityReadConfig(process.env);
 const client=createClient(config);
 const content=await fetchSanityContent(query=>client.fetch(query),new Date().toISOString(),{perspective:config.perspective});
 const target=resolve(process.env.CONTENT_SNAPSHOT_PATH||'.cache/content.json');
 await mkdir(dirname(target),{recursive:true});
 const temporary=target+'.tmp';
 await writeFile(temporary,JSON.stringify(content,null,2)+'\n','utf8');
 await rename(temporary,target);
 console.log(`Pobrano i zweryfikowano treści (${config.perspective}).`);
 console.log(`Snapshot: ${target}. Zatwierdzenie treści: ${content.approved?'tak':'nie'}.`);
} catch(error) {
 // Transport errors can contain request headers. Never dump a client error object.
 const message=error instanceof Error?error.message:'Nieznany błąd';
 console.error(message.startsWith('Brak opublikowanych')||message.startsWith('Ustaw ')||message.startsWith('Podgląd szkiców')?message:'Nie udało się pobrać poprawnych treści Sanity. Sprawdź projekt, uprawnienia i walidację dokumentów; snapshot nie został zastąpiony.');
 process.exitCode=1;
}
