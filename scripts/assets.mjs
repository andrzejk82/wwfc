import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('public/images',{recursive:true});
for(const name of ['jarek-malinowski','karolina-owczarz'])await sharp(`assets/source/${name}.png`).resize(640,640).webp({quality:82}).toFile(`public/images/${name}.webp`);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0a0a0a"/><path d="M930 0h270v630H700z" fill="#ff3b12"/><g fill="#f3f0e9" font-family="Arial" font-weight="bold"><text x="65" y="115" font-size="38">WARSAW WEST FIGHT CLUB</text><text x="60" y="295" font-size="126">WEJDŹ</text><text x="60" y="430" font-size="126">NA MATĘ.</text><text x="65" y="565" font-size="27">STRZYKULSKA 6A · OŻARÓW MAZOWIECKI</text></g></svg>`;
await sharp(Buffer.from(svg)).jpeg({quality:88}).toFile('public/images/og-default.jpg');
