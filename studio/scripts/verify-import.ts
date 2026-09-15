import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-09-01'}).withConfig({useCdn: false, perspective: 'raw'})
const result = await client.fetch(`{
  "drafts": count(*[_id in path("drafts.**") && _type in ["siteSettings", "coach", "discipline", "scheduleRelease"]]),
  "published": count(*[!(_id in path("drafts.**")) && _type in ["siteSettings", "coach", "discipline", "scheduleRelease"]]),
  "sessions": count(*[_id == "drafts.schedule-wrzesien-2026"][0].sessions),
  "photos": *[_id in ["drafts.coach-jarek-malinowski", "drafts.coach-karolina-owczarz"]]{name, "imageExists": defined(image.asset->url)},
  "approved": *[_id == "drafts.site-settings"][0].approved
}`)
console.log(JSON.stringify(result, null, 2))
if (result.drafts !== 33 || result.published !== 0 || result.sessions !== 81 || result.approved !== false || result.photos.length !== 2 || result.photos.some((photo: {imageExists: boolean}) => !photo.imageExists)) process.exitCode = 1
