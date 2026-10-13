import { codeToHtml } from 'shiki'
import { siteCodeTheme } from './code-theme'
import { showRegions } from './snippet-regions'

// Text-only TSX examples are displayed without compiling or executing them.
const files = import.meta.glob(
  '/src/snippets/**/*.{ts,tsx,vue,svelte,tsx.txt}',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>
export function region(file: string) {
  const source = files[`/src/snippets/${file}`]
  if (!source) throw new Error(`Missing snippet: ${file}`)
  const shown = showRegions(source)
  if (!shown) throw new Error(`Missing show region: ${file}`)
  return shown
}
// Identifiers an anchor names in code: `document.querySelectorAll` gives
// both words, `<CartProvider>` gives `CartProvider`, `React` gives `React`.
export function anchorWords(anchor: string) {
  return anchor.match(/[A-Za-z_$][\w$]*/g) ?? []
}
// Stores (`$cart`) and the anchors a section's preview promised get their
// own classes, so the reader finds them in the unfolded code.
export async function snippet(file: string, anchors: string[] = []) {
  const words = new Set(anchors.flatMap(anchorWords))
  const pattern = [
    String.raw`\$\w+`,
    ...[...words].map((word) => String.raw`\b${word}\b`),
  ].join('|')
  const markOf = (content: string) =>
    /^\$\w+$/.test(content)
      ? 'code-store'
      : words.has(content)
        ? 'code-anchor'
        : undefined
  return codeToHtml(region(file), {
    lang: file.endsWith('.vue')
      ? 'vue'
      : file.endsWith('.svelte')
        ? 'svelte'
        : file.endsWith('tsx') || file.endsWith('tsx.txt')
          ? 'tsx'
          : 'ts',
    theme: siteCodeTheme,
    mergeWhitespaces: false,
    transformers: [
      {
        // Split marks out of merged tokens like `($user`. A mark's own color
        // keeps Shiki from merging it back with its neighbors.
        tokens(lines) {
          return lines.map((line) =>
            line.flatMap((token) => {
              let offset = token.offset
              return token.content
                .split(new RegExp(`(${pattern})`))
                .filter(Boolean)
                .map((content) => {
                  const mark = markOf(content)
                  const part = { ...token, content, offset }
                  if (mark) part.color = mark
                  offset += content.length
                  return part
                })
            }),
          )
        },
        span(node, _line, _col, _lineElement, token) {
          const mark = markOf(token.content)
          if (!mark || token.color !== mark) return
          delete node.properties.style
          this.addClassToHast(node, mark)
        },
      },
    ],
  })
}
