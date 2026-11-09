import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  cspAllows,
  linkProblem,
  markdownLinks,
  readPage,
} from './build-links.mjs'
import upstreamConfig from '../src/config/upstream.json' with { type: 'json' }

const root = process.argv[2] ?? 'dist'
const requiredPages = [
  'index.html',
  'docs/index.html',
  'docs/getting-started/index.html',
  'docs/api/index.html',
  'upstream.json',
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
  // Inline code runs only when the page's policy lists its hash, and a
  // resource from another host loads only when its directive names that host.
  for (const [file, page] of pages) {
    if (!page.csp) {
      errors.push(`${file}: missing Content-Security-Policy meta`)
      continue
    }
    for (const { tag, hash } of page.inline)
      if (!page.csp.includes(`'${hash}'`))
        errors.push(`${file}: inline <${tag}> not allowed by CSP (${hash})`)
    for (const { directive, url } of page.resources)
      if (!cspAllows(page.csp, directive, url, site))
        errors.push(`${file}: ${url} not allowed by CSP ${directive}`)
  }
  // Every upstream repository is listed with the release tag and commit it
  // was built from; a pinned commit has no tag.
  const { upstream } = JSON.parse(readFileSync(join(root, 'upstream.json')))
  for (const { id, repo } of upstreamConfig) {
    const revision = upstream?.[id]
    if (revision?.repo !== repo) errors.push(`upstream.json: no ${repo}`)
    else if (!revision.local && !/^[0-9a-f]{40}$/.test(revision.sha ?? '')) {
      errors.push(`upstream.json: ${id} has no commit`)
    } else if (!revision.local && !revision.pinned && !revision.tag) {
      errors.push(`upstream.json: ${id} has no release tag`)
    }
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
    `Build checks passed: ${pages.size} HTML pages, required outputs, navigation links, CSP for inline code and external resources, upstream releases, API IDs and ${exports.length} documentation exports.`,
  )
} catch (error) {
  console.error(`Build checks failed:\n${error.message}`)
  process.exitCode = 1
}
