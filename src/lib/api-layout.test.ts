import { describe, expect, it } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import type { Nodes, Root } from 'mdast'
import { layoutApi, remarkApiLayout } from './api-layout'
import { apiNavigation, type ApiExport } from './api-reference'

// Controlled metadata keeps these transform tests independent of package docs.
const api = (kind: ApiExport['kind']): ApiExport => ({
  kind,
  summary: '',
  deprecated: false,
})
const exports = new Map<string, ApiExport>([
  ['atom', api('functions')],
  ['Atom', api('type-aliases')],
  [
    'ReadableAtom',
    {
      ...api('interfaces'),
      members: ['get', 'listen', 'subscribe', 'value'].map((name) => ({
        name,
        owner: 'ReadableAtom',
      })),
    },
  ],
  [
    'WritableAtom',
    { ...api('interfaces'), members: [{ name: 'set', owner: 'WritableAtom' }] },
  ],
  [
    'MapStore',
    { ...api('interfaces'), members: [{ name: 'setKey', owner: 'MapStore' }] },
  ],
  [
    'computed',
    {
      ...api('variables'),
      callable: {
        description: 'Derive a value.\n\n```ts\ncomputed(source)\n```',
        signatures: [
          {
            code: 'computed(source: string): number',
            deprecated: 'Use numbers.',
          },
          { code: 'computed(source: number): number', deprecated: '' },
        ],
      },
    },
  ],
])
const groups = [
  { label: 'Stores', names: ['atom'] },
  { label: 'Derived state', names: ['computed'] },
  {
    label: 'Types',
    names: ['ReadableAtom', 'WritableAtom', 'MapStore', 'Atom'],
  },
]
const member = (id: string, name: string, body = 'A method.') =>
  `<a id="${id}"></a>\n\n##### ${name}()\n\n${body}\n\n`
const source =
  `An introduction.\n\n## Interfaces\n\n` +
  `<a id="readableatom"></a>\n\n### ReadableAtom\n\n#### Methods\n\n` +
  member('get-3', 'get', 'Get the value.\n\n###### Returns\n\nValue') +
  member('listen-3', 'listen') +
  member('subscribe-3', 'subscribe') +
  `<a id="writableatom"></a>\n\n### WritableAtom\n\n#### Methods\n\n` +
  member(
    'get-4',
    'get',
    'Copied get.\n\n###### Inherited from\n\n[ReadableAtom](/docs/api/#readableatom).[get](/docs/api/#get-3)',
  ) +
  member('set-3', 'set') +
  `<a id="mapstore"></a>\n\n### MapStore\n\n#### Methods\n\n` +
  member(
    'setkey',
    'setKey',
    'Set a key.\n\n###### Type Parameters\n\n' +
      '<a id="key"></a>\n\n###### Key\n\nKey type.\n\n' +
      '###### Parameters\n\n###### key\n\nKey name.\n\n' +
      '###### Returns\n\nNothing.',
  ) +
  `## Type Aliases\n\n<a id="atom"></a>\n\n### Atom\n\nA type.\n\n` +
  `## Variables\n\n<a id="computed"></a>\n\n### computed\n\n\`const computed: Computed;\`\n\n` +
  `## Functions\n\n<a id="atom-1"></a>\n\n### atom()\n\n` +
  `[Atom](/docs/api/#atom), [get](/docs/api/#get-4), [atom](/docs/api/#atom-1).`

function inspect(tree: Root) {
  const ids: string[] = []
  const navigationIds: string[] = []
  const urls: string[] = []
  function walk(node: Nodes) {
    if (node.data?.hProperties?.id) {
      const id = String(node.data.hProperties.id)
      ids.push(id)
      if (node.type === 'heading' && node.depth <= 3) navigationIds.push(id)
    }
    if (node.type === 'link') urls.push(node.url)
    if ('children' in node) for (const child of node.children) walk(child)
  }
  walk(tree)
  return { ids, urls, navigationIds }
}

describe('single API Markdown layout', () => {
  it('preserves supplied group/export order, method content and link targets', () => {
    const tree = fromMarkdown(source)
    layoutApi(tree, { groups, exports })
    const { ids, urls, navigationIds } = inspect(tree)
    expect(navigationIds).toEqual([
      'stores',
      'atom',
      'store-methods',
      'store-get',
      'store-set',
      'store-setkey',
      'store-listen',
      'store-subscribe',
      'derived-state',
      'computed',
      'types',
      'type-readableatom',
      'type-writableatom',
      'type-mapstore',
      'type-atom',
    ])
    expect(
      apiNavigation(groups).flatMap((group) => [
        group.anchor,
        ...group.items.map((item) => item.anchor),
      ]),
    ).toEqual(navigationIds)
    expect(new Set(ids).size).toBe(ids.length)
    expect(urls).toContain('/docs/api/#type-atom')
    expect(urls).toContain('/docs/api/#store-get')
    expect(
      urls
        .filter((url) => url.startsWith('/docs/api/#'))
        .every((url) => ids.includes(url.split('#')[1])),
    ).toBe(true)
    expect(JSON.stringify(tree)).not.toContain('Copied get.')
    expect(JSON.stringify(tree)).toContain('computed(source)')
    expect(JSON.stringify(tree)).toContain('Other overloads')
    const setKey = tree.children.findIndex(
      (node) =>
        node.type === 'heading' &&
        node.data?.hProperties?.id === 'store-setkey',
    )
    const listen = tree.children.findIndex(
      (node) =>
        node.type === 'heading' &&
        node.data?.hProperties?.id === 'store-listen',
    )
    const method = JSON.stringify(tree.children.slice(setKey, listen))
    expect(method).toContain('Key type.')
    expect(method).toContain('Key name.')
    expect(method).toContain('Nothing.')
  })

  it('keeps generic parameters, properties and repeated overload parameters distinct', () => {
    const tree = fromMarkdown(
      '## Interfaces\n\n' +
        '<a id="readableatom"></a>\n\n### ReadableAtom\n\n' +
        '#### Type Parameters\n\n<a id="value"></a>\n\n##### Value\n\nGeneric.\n\n' +
        '#### Properties\n\n<a id="value-1"></a>\n\n##### value\n\nStored value.\n\n' +
        '## Functions\n\n<a id="map"></a>\n\n### map()\n\n' +
        '#### Call Signature\n\nFirst overload.\n\n##### Type Parameters\n\n' +
        '<a id="value-2"></a>\n\n###### Value\n\nFirst generic.\n\n' +
        '#### Call Signature\n\nSecond overload.\n\n##### Type Parameters\n\n' +
        '<a id="value-3"></a>\n\n###### Value\n\nSecond generic.\n\n' +
        '[Generic](/docs/api/#value), [property](/docs/api/#value-1), ' +
        '[first](/docs/api/#value-2), [second](/docs/api/#value-3).',
    )
    layoutApi(tree, {
      groups: [
        { label: 'Functions', names: ['map'] },
        { label: 'Types', names: ['ReadableAtom'] },
      ],
      exports: new Map([
        ['map', api('functions')],
        ['ReadableAtom', exports.get('ReadableAtom')!],
      ]),
    })
    const { ids, urls } = inspect(tree)
    expect(new Set(ids).size).toBe(ids.length)
    expect(urls).toContain('/docs/api/#type-readableatom-value')
    expect(new Set(urls).size).toBe(4)
    expect(urls.every((url) => ids.includes(url.split('#')[1]))).toBe(true)
    expect(JSON.stringify(tree)).toContain('Stored value.')
    expect(JSON.stringify(tree)).toContain('Second generic.')
  })

  it('fails the build if a package export is absent from TypeDoc output', () => {
    expect(() =>
      layoutApi(fromMarkdown(source), {
        groups,
        exports: new Map([...exports, ['missing', {} as ApiExport]]),
      }),
    ).toThrow('TypeDoc did not render missing')
  })

  it('leaves other documentation pages untouched', () => {
    const tree = fromMarkdown('# Example\n\n## Functions\n\nText')
    const original = structuredClone(tree)
    remarkApiLayout({
      groups,
      exports: Object.fromEntries(exports),
      cacheKey: 'test',
    })(tree, {
      path: 'src/content/docs/docs/getting-started.mdx',
    })
    expect(tree).toEqual(original)
  })
})
