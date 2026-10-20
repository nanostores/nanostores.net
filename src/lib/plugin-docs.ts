import { plainText, type ReadmePage } from './readme-docs'

export interface PluginDoc {
  id: string
  label: string
  slug: string
  package: string
}

// A plugin with the upstream repository and commit its README came from.
export interface PluginSource extends PluginDoc {
  repo: string
  sha: string
}

// Where scripts/fetch-upstream.mjs copies the README's relative images.
export function upstreamImages(id: string): string {
  return `/vendor/upstream/${id}`
}

// Applies `fn` to the text between fenced code blocks (``` and ~~~).
function outsideFences(body: string, fn: (text: string) => string): string {
  const chunks: string[] = []
  let text: string[] = []
  let fence = false
  const flush = () => {
    if (text.length > 0) chunks.push(fn(text.join('\n')))
    text = []
  }
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (!fence) flush()
      fence = !fence
      chunks.push(line)
    } else if (fence) {
      chunks.push(line)
    } else {
      text.push(line)
    }
  }
  flush()
  return chunks.join('\n')
}

// The "Made at Evil Martians" line sits between two `---` lines. Cut the
// whole block and leave the text around it.
function removeMadeAt(lines: string[]): string[] {
  const result = [...lines]
  for (;;) {
    const at = result.findIndex(
      (line) => /Made at/.test(line) && /evilmartians\.com/.test(line),
    )
    if (at === -1) return result
    let before = at - 1
    while (before >= 0 && result[before].trim() === '') before--
    let after = at + 1
    while (after < result.length && result[after].trim() === '') after++
    if (
      before < 0 ||
      after >= result.length ||
      result[before].trim() !== '---' ||
      result[after].trim() !== '---'
    ) {
      throw new Error(
        'README has a "Made at" line without `---` around it; the format changed',
      )
    }
    result.splice(before, after - before + 1)
  }
}

export function pluginPage(
  readme: string,
  plugin: PluginSource,
  order: number,
  // Core README anchors that are docs pages, from `coreRoutes()`.
  coreLinks: Map<string, string> = new Map(),
): ReadmePage {
  const blob = `https://github.com/${plugin.repo}/blob/${plugin.sha}`
  const local = upstreamImages(plugin.id)

  const lines = readme.split(/\r?\n/)
  const h1 = lines.findIndex((line) => /^# \S/.test(line))
  if (h1 === -1) throw new Error(`${plugin.package} README has no "# " title`)
  const title = plainText(lines[h1].slice(2))
  lines.splice(h1, 1)

  // Promo and logo removal skips code blocks, like the link rewrites below.
  let firstImgSeen = false
  let body = outsideFences(lines.join('\n'), (text) => {
    let result = removeMadeAt(text.split('\n')).join('\n')
    // Only the first <img>, and only when it is the logo.
    const firstImg = firstImgSeen ? null : result.match(/<img\b[^>]*>/)
    if (firstImg) {
      firstImgSeen = true
      if (/logo/i.test(firstImg[0])) result = result.replace(firstImg[0], '')
    }
    return result.replace(
      /<a\b[^>]*evilmartians\.com[^>]*>(?:(?!<\/a>)[\s\S])*?sponsored-by-evil-martians(?:(?!<\/a>)[\s\S])*?<\/a>[ \t]*/g,
      '',
    )
  })

  body = outsideFences(body, (text) =>
    text
      .replace(
        /(\]\(|href=")https:\/\/github\.com\/nanostores\/nanostores(?:\/blob\/[^/)"#\s]+\/README\.md)?#([^)"\s]+)/g,
        (match, start: string, anchor: string) => {
          const route = coreLinks.get(anchor)
          return route ? `${start}${route}` : match
        },
      )
      .replace(
        /(!\[[^\]]*\]\()(?!#|[a-z][a-z0-9+.-]*:|\/)(?:\.\/)?([^)\s]+)/gi,
        (_, start: string, path: string) => `${start}${local}/${path}`,
      )
      .replace(
        /(\]\()(?!#|[a-z][a-z0-9+.-]*:|\/)(?:\.\/)?([^)\s]+)/gi,
        (_, start: string, path: string) => `${start}${blob}/${path}`,
      )
      .replace(
        /\b(src|srcset)="(?!#|[a-z][a-z0-9+.-]*:|\/)(?:\.\/)?([^"]+)"/gi,
        (_, attr: string, path: string) => `${attr}="${local}/${path}"`,
      ),
  ).trim()

  const firstParagraph =
    body.split(/\n\s*\n/).find((paragraph) => paragraph.trim()) ?? ''
  const footer =
    `*Imported from the [${title} README](${blob}/README.md). ` +
    'Improve this page there.*'

  return {
    id: `docs/ecosystem/${plugin.slug}`,
    title,
    description: plainText(firstParagraph).slice(0, 160),
    order,
    label: plugin.label,
    body: [body, '---', footer].join('\n\n'),
  }
}
