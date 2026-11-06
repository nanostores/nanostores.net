import GithubSlugger from 'github-slugger'

// Parts of the Nano Stores README published as docs pages. Every listed
// heading must exist, so a renamed section fails the build instead of
// silently disappearing from the docs.
interface Section {
  parent: string
  dir: string
  pages: string[]
}

export const readmeSections: Section[] = [
  {
    parent: 'Guide',
    dir: 'concepts',
    pages: [
      'Atoms',
      'Maps',
      'Lazy Stores',
      'Computed Stores',
      'Value Comparison',
      'Effects',
      'Batching',
      'Map Creator',
      'Tasks',
      'Store Events',
    ],
  },
  {
    parent: 'Integration',
    dir: 'frameworks',
    pages: [
      'React & Preact',
      'Vue',
      'Svelte',
      'Solid',
      'Lit',
      'Angular',
      'Alpine.js',
      'Web Components',
      'Vanilla JS',
    ],
  },
  {
    parent: 'Integration',
    dir: 'guides',
    pages: ['Server-Side Rendering', 'Tests'],
  },
  {
    parent: 'Best Practices',
    dir: 'handbook',
    pages: [
      'Move Logic from Components to Stores',
      'Separate changes and reaction',
      'Reduce `get()` usage outside of tests',
    ],
  },
]

export interface ReadmePage {
  id: string
  title: string
  description: string
  order: number
  label?: string
  body: string
}

interface Heading {
  level: number
  text: string
  start: number
  end: number
}

const REPO = 'https://github.com/nanostores/nanostores'

// `sha` is the upstream commit the README was read from.
export function readmeUrl(sha: string): string {
  return `${REPO}/blob/${sha}/README.md`
}

// Size Limit numbers from the README: a single atom up to map with computed.
export function coreSize(readme: string): string {
  const size = readme.match(/Between (\d+) and (\d+) bytes/)
  if (!size) throw new Error('README no longer says "Between N and M bytes"')
  return `${size[1]}–${size[2]} bytes`
}

function headings(lines: string[]): Heading[] {
  const result: Heading[] = []
  let fence = false
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const match = !fence && line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (match) {
      result.push({
        level: match[1].length,
        text: match[2],
        start: index,
        end: lines.length,
      })
    }
  })
  result.forEach((heading, i) => {
    const next = result
      .slice(i + 1)
      .find((other) => other.level <= heading.level)
    if (next) heading.end = next.start
  })
  return result
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\](\([^)]*\)|\[[^\]]*\])?/g, '$1')
    .replace(/[*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function planReadme(readme: string) {
  const lines = readme.split(/\r?\n/)
  const all = headings(lines)

  const definitions = new Map<string, string>()
  const definitionLine = /^\[([^\]]+)\]:\s+\S+/
  for (const line of lines) {
    const match = line.match(definitionLine)
    if (match) definitions.set(match[1].toLowerCase(), line)
  }

  const slugger = new GithubSlugger()
  const anchors = new Map<string, string>()
  for (const heading of all) anchors.set(slugger.slug(heading.text), '')

  const orders = new Map<string, number>()
  const planned = readmeSections.flatMap((section) => {
    const parent = all.find((h) => h.level === 2 && h.text === section.parent)
    if (!parent) throw new Error(`README has no "## ${section.parent}"`)
    return section.pages.map((text) => {
      // Several README sections can feed one directory; keep their order.
      const order = (orders.get(section.dir) ?? 0) + 1
      orders.set(section.dir, order)
      const heading = all.find(
        (h) =>
          h.level === 3 &&
          h.text === text &&
          h.start > parent.start &&
          h.start < parent.end,
      )
      if (!heading) {
        throw new Error(`README has no "### ${text}" in "${section.parent}"`)
      }
      const route = `/docs/${section.dir}/${slug(text)}/`
      anchors.set(new GithubSlugger().slug(text), route)
      return { heading, order, route, id: `docs/${section.dir}/${slug(text)}` }
    })
  })

  return { lines, definitions, definitionLine, anchors, planned }
}

// Core README anchors that became docs pages: `store-events` → route.
export function coreRoutes(readme: string): Map<string, string> {
  const routes = new Map<string, string>()
  for (const [anchor, route] of planReadme(readme).anchors) {
    if (route) routes.set(anchor, route)
  }
  return routes
}

export function readmePages(readme: string, sha: string): ReadmePage[] {
  const { lines, definitions, definitionLine, anchors, planned } =
    planReadme(readme)
  const url = readmeUrl(sha)
  const rewriteAnchors = (markdown: string) =>
    markdown.replace(/\]\(#([^)]+)\)/g, (_, anchor: string) => {
      const route = anchors.get(anchor)
      return `](${route || `${url}#${anchor}`})`
    })

  return planned.map(({ heading, order, id }) => {
    const content = lines
      .slice(heading.start + 1, heading.end)
      .filter((line) => !definitionLine.test(line))
      .join('\n')
      .trim()
    const used = [...definitions]
      .filter(([label]) => content.toLowerCase().includes(`[${label}]`))
      .map(([, line]) => line)
    const firstParagraph = content.split(/\n\s*\n/)[0] ?? ''
    const anchor = new GithubSlugger().slug(heading.text)
    const body = [
      rewriteAnchors(content),
      used.join('\n'),
      '---',
      `*Imported from the [Nano Stores README](${url}#${anchor}). ` +
        'Improve this page there.*',
    ]
      .filter(Boolean)
      .join('\n\n')
    return {
      id,
      title: plainText(heading.text),
      description: plainText(firstParagraph).slice(0, 160),
      order,
      body,
    }
  })
}
