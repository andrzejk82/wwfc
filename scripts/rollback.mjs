import {readFile} from 'node:fs/promises';
import {pagesApi} from './pages-api.mjs';
const previous=JSON.parse(await readFile('.cache/previous-deployment.json','utf8'));
if(!previous.id||!/^[a-f0-9-]{36}$/.test(previous.id))throw new Error('Brak wcześniejszego wdrożenia; wymagane ręczne działanie opiekuna.');
await pagesApi(`/deployments/${previous.id}/rollback`,'POST');
console.log('Przywrócono poprzednie wdrożenie Pages.');
