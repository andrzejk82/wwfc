import {createReadStream} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

// Run with `sanity exec scripts/import-source-photos.ts --with-user-token`.
// This migration only fills missing images on the two existing coach drafts.
const client = getCliClient({apiVersion: '2026-09-01'}).withConfig({useCdn: false, perspective: 'raw'})
if (client.config().projectId !== 'objbb93c' || client.config().dataset !== 'production') throw new Error('Nieprawidłowy projekt lub dataset.')
for (const [slug, name] of [['jarek-malinowski', 'Jarek Malinowski'], ['karolina-owczarz', 'Karolina Owczarz']]) {
  const id = `drafts.coach-${slug}`
  const draft = await client.getDocument(id)
  if (!draft || draft._type !== 'coach') throw new Error(`Brak szkicu trenera: ${slug}`)
  if (draft.image) {console.log(`Zachowano istniejące zdjęcie: ${name}`); continue}
  const path = fileURLToPath(new URL(`../../public/images/${slug}.webp`, import.meta.url))
  const asset = await client.assets.upload('image', createReadStream(path), {filename: `${slug}.webp`})
  await client.patch(id).setIfMissing({image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: name}}).commit()
  console.log(`Dodano zdjęcie do szkicu: ${name}`)
}
