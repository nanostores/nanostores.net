import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { linkProblem, markdownLinks, readPage } from './build-links.mjs'

const root = process.argv[2] ?? 'dist'
const requiredPages = [
  'index.html',
  'docs/index.html',
  'docs/getting-started/index.html',
  'docs/api/index.html',
]
const exports = ['llms.txt', 'llms-full.txt', 'llms-small.txt']

try {
  const files = new Set(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        relative(root, join(entry.parentPath, entry.name)).replaceAll(
          '\\',
          '/',
        ),
      ),
  )
  const errors = []
  for (const file of [...requiredPages, ...exports]) {
    if (!files.has(file)) errors.push(`${file}: missing required output`)
    else if (!readFileSync(join(root, file), 'utf8').trim())
      errors.push(`${file}: empty required output`)
  }
  // Report missing entrypoints before trying to read their metadata.
  if (errors.length) throw new Error(errors.join('\n'))

  const pages = new Map(
    [...files]
      .filter((file) => file.endsWith('.html'))
      .map((file) => [file, readPage(readFileSync(join(root, file), 'utf8'))]),
  )
  const canonical = pages.get('index.html')?.canonical
  if (!canonical) throw new Error('index.html: missing canonical URL')
  const site = new URL(canonical)
  const anchors = new Map(
    [...pages].map(([file, page]) => [file, page.anchors]),
  )

  for (const [file, page] of pages) {
    const from = `/${file.replace(/(^|\/)index\.html$/, '$1')}`
    for (const href of page.links) {
      const problem = linkProblem(href, from, site, files, anchors)
      if (problem) errors.push(`${file} → ${href} (${problem})`)
    }
  }
  // Inline code runs only when the page's policy lists its hash.
  for (const [file, page] of pages) {
    if (!page.csp) errors.push(`${file}: missing Content-Security-Policy meta`)
    else
      for (const { tag, hash } of page.inline)
        if (!page.csp.includes(`'${hash}'`))
          errors.push(`${file}: inline <${tag}> not allowed by CSP (${hash})`)
  }
  const ids = pages.get('docs/api/index.html').ids
  const seen = new Set()
  for (const id of ids) {
    if (seen.has(id)) errors.push(`docs/api/index.html: repeated id ${id}`)
    seen.add(id)
  }
  for (const name of exports) {
    for (const href of markdownLinks(readFileSync(join(root, name), 'utf8'))) {
      // Combined sets lose the source page for bare fragments.
      if (href.startsWith('#')) continue
      const problem = linkProblem(href, '/', site, files, anchors)
      if (problem) errors.push(`${name} → ${href} (${problem})`)
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
  console.info(
    `Build checks passed: ${pages.size} HTML pages, required outputs, navigation links, inline CSP hashes, API IDs and ${exports.length} documentation exports.`,
  )
} catch (error) {
  console.error(`Build checks failed:\n${error.message}`)
  process.exitCode = 1
}
