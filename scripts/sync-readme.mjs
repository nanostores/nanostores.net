// Copies READMEs for the installed versions into src/vendor: the Nano Stores
// core README and the READMEs of the plugins listed in src/config/plugin-docs.json.
// The npm packages ship shortened READMEs, so the full ones come from the
// release tags on GitHub. Run it after updating a dependency.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { relativeImagePaths } from '../src/lib/plugin-images.mjs'
import pluginDocs from '../src/config/plugin-docs.json' with { type: 'json' }

// The site validates the full shape (src/lib/plugin-config.ts); here only the
// fields this script reads.
for (const plugin of pluginDocs) {
  for (const field of ['slug', 'package', 'repo']) {
    if (typeof plugin[field] !== 'string' || !plugin[field]) {
      throw new Error(
        `src/config/plugin-docs.json: "${field}" is missing in ${JSON.stringify(plugin)}`,
      )
    }
  }
  if (typeof plugin.tagPrefix !== 'string') {
    throw new Error(
      `src/config/plugin-docs.json: "tagPrefix" is missing for ${plugin.package}`,
    )
  }
}

async function fetchReadme(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

const pkg = new URL('../node_modules/nanostores/package.json', import.meta.url)
const { version } = JSON.parse(await readFile(pkg, 'utf8'))
const url = `https://raw.githubusercontent.com/nanostores/nanostores/${version}/README.md`
const readme = await fetchReadme(url)
await writeFile(
  new URL('../src/vendor/nanostores-readme.md', import.meta.url),
  `<!-- nanostores@${version} ${url} -->\n${readme}`,
)
console.log(`Synced README for nanostores@${version}`)

for (const plugin of pluginDocs) {
  const pluginPkg = new URL(
    `../node_modules/${plugin.package}/package.json`,
    import.meta.url,
  )
  const { version } = JSON.parse(await readFile(pluginPkg, 'utf8'))
  const url = `https://raw.githubusercontent.com/${plugin.repo}/${plugin.tagPrefix}${version}/README.md`
  const readme = await fetchReadme(url)
  await writeFile(
    new URL(`../src/vendor/plugins/${plugin.slug}.md`, import.meta.url),
    `<!-- ${plugin.package}@${version} ${url} -->\n${readme}`,
  )
  // Relative images are copied too and served from public/vendor/plugins.
  for (const image of relativeImagePaths(readme)) {
    if (image.split('/').includes('..')) {
      throw new Error(
        `${plugin.package} README has an image outside the repo: ${image}`,
      )
    }
    const imageUrl = `https://raw.githubusercontent.com/${plugin.repo}/${plugin.tagPrefix}${version}/${image}`
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`${imageUrl} returned ${response.status}`)
    const file = new URL(
      `../public/vendor/plugins/${plugin.slug}/${image}`,
      import.meta.url,
    )
    await mkdir(new URL('.', file), { recursive: true })
    await writeFile(file, Buffer.from(await response.arrayBuffer()))
    console.log(`  image ${image}`)
  }
  console.log(`Synced README for ${plugin.package}@${version}`)
}
