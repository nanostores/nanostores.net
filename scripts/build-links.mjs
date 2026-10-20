import { createHash } from 'node:crypto'
import { parse } from 'parse5'
import { fromMarkdown } from 'mdast-util-from-markdown'

/** @param {string} html */
export function readPage(html) {
  /** @type {string | undefined} */
  let canonical
  /** @type {string[]} */
  const links = []
  /** @type {string[]} */
  const ids = []
  const anchors = new Set()
  /** @type {string | undefined} */
  let csp
  /** @type {{ tag: string, hash: string }[]} */
  const inline = []
  /** @param {import('parse5').DefaultTreeAdapterMap['node']} node */
  function walk(node) {
    if ('tagName' in node) {
      const attrs = Object.fromEntries(
        node.attrs.map(({ name, value }) => [name, value]),
      )
      if (attrs.id) {
        ids.push(attrs.id)
        anchors.add(attrs.id)
      }
      if (node.tagName === 'a' && attrs.name) anchors.add(attrs.name)
      if ((node.tagName === 'a' || node.tagName === 'area') && 'href' in attrs)
        links.push(attrs.href)
      if (node.tagName === 'link' && attrs.rel === 'canonical' && !canonical)
        canonical = attrs.href
      if (
        node.tagName === 'meta' &&
        attrs['http-equiv']?.toLowerCase() === 'content-security-policy'
      )
        csp = attrs.content
      if (
        (node.tagName === 'script' && !('src' in attrs)) ||
        node.tagName === 'style'
      ) {
        const body = node.childNodes
          .map((child) => ('value' in child ? child.value : ''))
          .join('')
        const hash = createHash('sha256').update(body).digest('base64')
        inline.push({ tag: node.tagName, hash: `sha256-${hash}` })
      }
    }
    if ('childNodes' in node) for (const child of node.childNodes) walk(child)
  }
  // A tree parser reads markup without browser APIs or script execution.
  walk(parse(html))
  return { canonical, links, ids, anchors, csp, inline }
}

/** @param {string} markdown */
export function markdownLinks(markdown) {
  /** @type {Map<string, string>} */
  const definitions = new Map()
  /** @type {string[]} */
  const links = []
  /**
   * @param {import('mdast').Nodes} node
   * @param {(node: import('mdast').Nodes) => void} visit
   */
  function walk(node, visit) {
    visit(node)
    if ('children' in node)
      for (const child of node.children) walk(child, visit)
  }
  const tree = fromMarkdown(markdown)
  walk(tree, (node) => {
    if (node.type === 'definition') definitions.set(node.identifier, node.url)
  })
  walk(tree, (node) => {
    if (node.type === 'link') links.push(node.url)
    if (node.type === 'linkReference') {
      const href = definitions.get(node.identifier)
      if (href !== undefined) links.push(href)
    }
    if (node.type === 'html') links.push(...readPage(node.value).links)
  })
  return links
}

/**
 * @param {string} href
 * @param {string} from
 * @param {URL} site
 * @param {Set<string>} files
 * @param {Map<string, Set<string>>} anchors
 */
export function linkProblem(href, from, site, files, anchors) {
  try {
    const url = new URL(href, new URL(from, site))
    if (url.origin !== site.origin) return
    const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, '')
    const target = files.has(path)
      ? path
      : `${path ? `${path}/` : ''}index.html`
    if (!files.has(target)) return 'missing page or linked file'
    // Text fragments and #top can scroll without a matching element.
    const fragment = decodeURIComponent(url.hash.slice(1).split(':~:')[0])
    if (
      fragment &&
      fragment.toLowerCase() !== 'top' &&
      target.endsWith('.html') &&
      !anchors.get(target)?.has(fragment)
    ) {
      return 'missing anchor'
    }
  } catch {
    return 'invalid URL or encoding'
  }
}
