// Relative image paths a plugin README refers to, outside code blocks.
// Plain .mjs so that scripts/sync-readme.mjs and the site share one function.
// The logo is left out: the docs page drops it.

const relative = (path) => !/^(#|[a-z][a-z0-9+.-]*:|\/)/i.test(path)

/** @param {string} readme */
export function relativeImagePaths(readme) {
  const found = new Set()
  let fence = false
  const text = []
  for (const line of readme.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    else if (!fence) text.push(line)
  }
  const body = text.join('\n')
  const add = (path) => {
    if (relative(path)) found.add(path.replace(/^\.\//, ''))
  }
  for (const [tag] of body.matchAll(/<(?:img|source)\b[^>]*>/g)) {
    if (/logo/i.test(tag)) continue
    for (const [, path] of tag.matchAll(/\b(?:src|srcset)="([^"]+)"/g)) {
      add(path)
    }
  }
  for (const [, path] of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) add(path)
  return [...found]
}
