import {mkdir,writeFile} from 'node:fs/promises';
import {sourceContent} from '../src/lib/content/repository.ts';
import {prepareSanityDrafts} from '../src/lib/content/sanity-seed.ts';

const docs=prepareSanityDrafts(sourceContent());
await mkdir('.cache',{recursive:true});
await writeFile('.cache/sanity-initial.ndjson',docs.map(d=>JSON.stringify(d)).join('\n')+'\n','utf8');
await writeFile('.cache/sanity-supplement.ndjson',docs.filter(d=>['priceGroup','pricingPage','faqItem'].includes(d._type)).map(d=>JSON.stringify(d)).join('\n')+'\n','utf8');
await writeFile('.cache/sanity-settings-supplement.json',JSON.stringify({openingHours:docs.find(d=>d._id==='drafts.site-settings').openingHours},null,2),'utf8');
console.log(`Przygotowano ${docs.length} szkiców w .cache/sanity-initial.ndjson. Nie wysłano danych do Sanity.`);
console.log('Dane wymagają zatwierdzenia. Osobny suplement zawiera cennik, FAQ i godziny otwarcia; istniejący grafik pozostaje poza suplementem.');
