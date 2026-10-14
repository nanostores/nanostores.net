import { fromMarkdown } from 'mdast-util-from-markdown'
import { slug } from 'github-slugger'
import type { Heading, Root, RootContent } from 'mdast'
import type {} from 'mdast-util-to-hast'
import {
  apiAnchor,
  apiMemberAnchor,
  storeMethods,
  type ApiExport,
  type ApiGroup,
} from './api-reference'

interface LayoutOptions {
  groups: ApiGroup[]
  exports: Map<string, ApiExport>
}

interface Options {
  groups: ApiGroup[]
  exports: Record<string, ApiExport>
  cacheKey: string
}

const text = (node: RootContent): string => {
  if ('value' in node) return String(node.value)
  if ('children' in node)
    return node.children.map((child) => text(child as RootContent)).join('')
  return ''
}

const heading = (
  label: string,
  depth: Heading['depth'],
  id: string,
): Heading => ({
  type: 'heading',
  depth,
  children: [{ type: 'text', value: label }],
  data: { hProperties: { id } },
})

const htmlAnchor = (node: RootContent): string | undefined =>
  node.type === 'html' ||
  (node.type === 'paragraph' &&
    node.children.every((child) => child.type === 'html'))
    ? text(node)
        .trim()
        .match(/^<a id="([^"]+)"><\/a>$/)?.[1]
    : undefined

const trimRules = (nodes: RootContent[]) => {
  while (nodes.at(-1)?.type === 'thematicBreak') nodes.pop()
  return nodes
}

// The store methods section follows the group with the store constructors.
const hasStoreMethods = (group: ApiGroup): boolean =>
  group.names.includes('atom')

const disclosure = (label: string, body: RootContent[]): RootContent[] => [
  { type: 'html', value: `<details>\n<summary>${label}</summary>` },
  ...body,
  { type: 'html', value: '</details>' },
]

function foldOverloads(block: RootContent[]): RootContent[] {
  const signatures = block.flatMap((node, index) =>
    node.type === 'heading' &&
    node.depth === 4 &&
    text(node) === 'Call Signature'
      ? [index]
      : [],
  )
  if (signatures.length < 2) return block
  return [
    ...block.slice(0, signatures[0]),
    ...block.slice(signatures[0] + 1, signatures[1]),
    ...disclosure('Other overloads', block.slice(signatures[1])),
  ]
}

function apiIndex(groups: ApiGroup[]): RootContent {
  const escape = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('"', '&quot;')
  const indexGroups = groups.flatMap((group) => {
    const entry = {
      label: group.label,
      anchor: slug(group.label),
      items: group.names.map((name) => ({
        label: name,
        anchor: apiAnchor(name),
      })),
    }
    return hasStoreMethods(group)
      ? [
          entry,
          {
            label: 'Store methods',
            anchor: 'store-methods',
            items: storeMethods.map(({ owner, name }) => ({
              label: `${name}()`,
              anchor: apiMemberAnchor(owner, name),
            })),
          },
        ]
      : [entry]
  })
  const renderGroup = (group: (typeof indexGroups)[number]) => {
    const sectionLink = `<a href="#${group.anchor}">${escape(group.label)}</a>`
    const items = `<ul>${group.items
      .map(
        ({ label, anchor }) =>
          `<li><a href="#${anchor}"><code>${escape(label)}</code></a></li>`,
      )
      .join('')}</ul>`
    if (group.label === 'Types' || group.label === 'Deprecated') {
      return `<details class="api-index-group"><summary>${escape(group.label)} <span class="api-index-count">${group.items.length}</span></summary><div class="api-index-expanded"><p class="api-index-section">${sectionLink} <span aria-hidden="true">→</span></p>${items}</div></details>`
    }
    return `<div class="api-index-group"><p class="api-index-section">${sectionLink}</p>${items}</div>`
  }
  const main = indexGroups.filter(
    ({ label }) => label !== 'Types' && label !== 'Deprecated',
  )
  const secondary = indexGroups.filter(
    ({ label }) => label === 'Types' || label === 'Deprecated',
  )
  return {
    type: 'html',
    value: `<nav class="api-index not-content" aria-label="API index" data-pagefind-ignore="all"><p class="api-index-title">API index</p><div class="api-index-main">${main.map(renderGroup).join('')}</div><div class="api-index-secondary">${secondary.map(renderGroup).join('')}</div></nav>`,
  }
}

// Presentation only: TypeDoc still owns conversion and generates one module
// with its built-in router. This Markdown pass orders the existing sections,
// gives headings stable IDs, and moves the everyday store methods up front.
export function layoutApi(
  tree: Root,
  { groups, exports }: LayoutOptions,
): void {
  const blocks = new Map<string, RootContent[]>()
  const intro: RootContent[] = []
  const anchors = new Map<string, string>()
  const inherited = new Map<string, string>()
  let current: RootContent[] | undefined
  let pendingAnchor: string | undefined
  let started = false

  for (const node of tree.children) {
    const id = htmlAnchor(node)
    if (id) {
      pendingAnchor = id
      continue
    }
    if (node.type === 'heading' && node.depth === 2) {
      started = true
      current = undefined
      continue
    }
    if (node.type === 'heading' && node.depth === 3) {
      const name = text(node).replaceAll('~~', '').replace(/\(\)$/, '')
      if (!exports.has(name)) throw new Error(`Unexpected API section: ${name}`)
      const canonical = apiAnchor(name)
      if (pendingAnchor) anchors.set(pendingAnchor, canonical)
      current = [heading(name, 3, canonical)]
      blocks.set(name, current)
      pendingAnchor = undefined
      continue
    }
    if (current) {
      if (pendingAnchor)
        current.push({ type: 'html', value: `<a id="${pendingAnchor}"></a>` })
      current.push(node)
    } else if (!started) intro.push(node)
    pendingAnchor = undefined
  }

  for (const name of exports.keys()) {
    if (!blocks.has(name)) throw new Error(`TypeDoc did not render ${name}`)
  }

  const methods = new Map<string, RootContent[]>()
  for (const [name, block] of blocks) {
    const result: RootContent[] = [block[0]]
    for (let index = 1; index < block.length;) {
      const id = htmlAnchor(block[index])
      const title = block[index + 1]
      if (!id || title?.type !== 'heading') {
        result.push(block[index++])
        continue
      }
      let end = index + 2
      while (end < block.length) {
        const node = block[end]
        if (
          (node.type === 'heading' && node.depth <= title.depth) ||
          (htmlAnchor(node) &&
            block[end + 1]?.type === 'heading' &&
            (block[end + 1] as Heading).depth <= title.depth)
        )
          break
        end++
      }
      const body = trimRules(block.slice(index + 2, end))
      const member = text(title).replace(/\(\)$/, '').replace(/\?$/, '')
      // TypeDoc also anchors type parameters, including repeated names in
      // overloads. Only real members use the stable public member anchor;
      // technical headings retain the uniqueness of TypeDoc's original ID.
      const isMember =
        title.depth === 5 &&
        exports.get(name)?.members?.some((item) => item.name === member)
      const canonical = isMember
        ? apiMemberAnchor(name, member)
        : `detail-${apiAnchor(name)}-${slug(id)}`
      anchors.set(id, canonical)
      const inheritedIndex = body.findIndex(
        (node) => node.type === 'heading' && text(node) === 'Inherited from',
      )
      const paragraph = body[inheritedIndex + 1]
      const link =
        inheritedIndex !== -1 &&
        paragraph?.type === 'paragraph' &&
        paragraph.children.filter((child) => child.type === 'link').at(-1)
      if (link && 'url' in link && link.url.startsWith('/docs/api/#')) {
        inherited.set(id, link.url.split('#')[1])
      } else if (
        storeMethods.some(
          (method) => method.owner === name && method.name === member,
        )
      ) {
        const shifted = body.map((node) =>
          node.type === 'heading'
            ? {
                ...node,
                depth: Math.max(4, node.depth - 2) as Heading['depth'],
              }
            : node,
        )
        methods.set(canonical, [
          heading(`$store.${member}()`, 3, canonical),
          ...shifted,
        ])
        result.push(
          ...fromMarkdown(`See [$store.${member}()](/docs/api/#${canonical}).`)
            .children,
        )
      } else {
        result.push(heading(text(title), title.depth, canonical), ...body)
      }
      index = end
    }

    const callable = exports.get(name)?.callable
    if (callable) {
      const active = callable.signatures.filter(
        (signature) => !signature.deprecated,
      )
      const primary = active.at(-1) ?? callable.signatures.at(-1)!
      const others = callable.signatures.filter(
        (signature) => signature !== primary,
      )
      blocks.set(name, [
        result[0],
        { type: 'code', lang: 'ts', value: primary.code },
        ...fromMarkdown(callable.description).children,
        ...(others.length
          ? fromMarkdown(
              '<details>\n<summary>Other overloads</summary>\n\n' +
                others
                  .map(
                    (signature) =>
                      (signature.deprecated
                        ? `> Deprecated: ${signature.deprecated}\n\n`
                        : '') +
                      '```ts\n' +
                      signature.code +
                      '\n```',
                  )
                  .join('\n\n') +
                '\n\n</details>',
            ).children
          : []),
      ])
    } else blocks.set(name, foldOverloads(trimRules(result)))
  }

  const resolveAnchor = (id: string, seen = new Set<string>()): string => {
    if (seen.has(id)) throw new Error(`Circular API inheritance: ${id}`)
    seen.add(id)
    const parent = inherited.get(id)
    return parent ? resolveAnchor(parent, seen) : (anchors.get(id) ?? id)
  }

  const output = [...intro, apiIndex(groups)]
  for (const group of groups) {
    output.push(heading(group.label, 2, slug(group.label)))
    for (const name of group.names) {
      const block = blocks.get(name)!
      const detailStart =
        group.label === 'Types'
          ? block.findIndex(
              (node, index) => index > 0 && node.type === 'heading',
            )
          : -1
      output.push(
        ...(detailStart === -1
          ? block
          : [
              ...block.slice(0, detailStart),
              ...disclosure('Type details', block.slice(detailStart)),
            ]),
      )
    }
    if (hasStoreMethods(group)) {
      output.push(heading('Store methods', 2, 'store-methods'))
      for (const method of storeMethods) {
        const id = apiMemberAnchor(method.owner, method.name)
        const nodes = methods.get(id)
        if (!nodes)
          throw new Error(
            `TypeDoc did not render ${method.owner}.${method.name}`,
          )
        output.push(...nodes)
      }
    }
  }
  tree.children = output

  // Astro's slugger does not reserve explicit IDs. Namespace technical
  // headings so a generic parameter called Stores cannot shadow a group ID.
  const used = new Set(
    output.flatMap((node) =>
      node.type === 'heading' && node.data?.hProperties?.id
        ? [String(node.data.hProperties.id)]
        : [],
    ),
  )
  let section = 'api'
  let exportName = ''
  const detailAnchors = new Set<RootContent>()
  for (const [index, node] of output.entries()) {
    const originalId = htmlAnchor(node)
    const next = output[index + 1]
    if (originalId && next?.type === 'heading') {
      const base = `detail-${section}-${slug(originalId)}`
      let id = base
      let suffix = 1
      while (used.has(id)) id = `${base}-${suffix++}`
      used.add(id)
      next.data = {
        ...next.data,
        hProperties: { ...next.data?.hProperties, id },
      }
      anchors.set(originalId, id)
      detailAnchors.add(node)
      continue
    }
    if (node.type !== 'heading') continue
    if (node.depth === 3) {
      section = String(node.data?.hProperties?.id)
      exportName = text(node)
    }
    if (node.data?.hProperties?.id) continue
    const member = text(node).replace(/\(\)$/, '').replace(/\?$/, '')
    if (
      node.depth === 5 &&
      exports
        .get(exportName)
        ?.members?.some(
          (item) => item.name === member && item.owner === exportName,
        )
    ) {
      node.data = {
        ...node.data,
        hProperties: { id: apiMemberAnchor(exportName, member) },
      }
      continue
    }
    const base = `detail-${section}-${slug(text(node))}`
    let id = base
    let suffix = 1
    while (used.has(id)) id = `${base}-${suffix++}`
    used.add(id)
    node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
  }

  tree.children = output.filter((node) => !detailAnchors.has(node))

  const rewriteLinks = (node: RootContent | Root) => {
    if (node.type === 'link' && node.url.startsWith('/docs/api/#')) {
      node.url = `/docs/api/#${resolveAnchor(node.url.split('#')[1])}`
    }
    if ('children' in node)
      for (const child of node.children) rewriteLinks(child as RootContent)
  }
  rewriteLinks(tree)
}

export function remarkApiLayout(options: Options) {
  const exports = new Map(Object.entries(options.exports))
  return (tree: Root, file: { path?: string }) => {
    if (
      file.path
        ?.replaceAll('\\', '/')
        .endsWith('/src/content/docs/docs/api/index.md')
    ) {
      layoutApi(tree, { groups: options.groups, exports })
    }
  }
}
