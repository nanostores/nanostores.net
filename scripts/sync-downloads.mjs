// Saves the weekly npm downloads of nanostores into src/vendor, so the
// home page quotes a number without the build depending on the network.
// Run it before a release, like sync:readme.
import { writeFile } from 'node:fs/promises'

const url = 'https://api.npmjs.org/downloads/point/last-week/nanostores'
const response = await fetch(url)
if (!response.ok) throw new Error(`${url} returned ${response.status}`)
const { downloads, start, end } = await response.json()
if (!Number.isInteger(downloads) || downloads <= 0) {
  throw new Error(`${url} returned no downloads`)
}
await writeFile(
  new URL('../src/vendor/npm-downloads.json', import.meta.url),
  JSON.stringify({ downloads, start, end }, null, 2) + '\n',
)
console.log(`nanostores: ${downloads} downloads, ${start} to ${end}`)
