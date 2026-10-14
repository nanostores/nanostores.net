import { getCollection, getEntry } from 'astro:content'
import { pluginDocs } from './plugin-config'

type Snippet = { file: string; caption: string }
type Module = { name: string; href: string; note: string }
type RowInput = {
  id?: string
  indexTitle?: string
  title: string
  text?: string
  read?: string
  plugin?: string
  module?: Module
  alternative?: string
  alternativeLead?: string
  snippets?: Snippet[]
  points?: string[]
  boundary?: string
  featured?: boolean
}

const readme = 'https://github.com/nanostores/nanostores'
const adapter = (title: string, id: string, read: string): RowInput => ({
  id: `framework-${id}`,
  title,
  read,
  module: {
    name: `@nanostores/${id}`,
    href: `https://github.com/nanostores/${id}#readme`,
    note: 'official',
  },
})
const builtIn = (title: string, read: string, anchor: string): RowInput => ({
  id: `framework-${anchor}`,
  title,
  read,
  module: { name: 'built in', href: `${readme}#${anchor}`, note: 'no adapter' },
})

const frameworks: RowInput[] = [
  adapter('React', 'react', 'useStore($cart)'),
  adapter('Preact', 'preact', 'useStore($cart)'),
  adapter('Vue', 'vue', 'useStore($cart)'),
  {
    ...builtIn('Svelte', '$cart — Svelte’s store contract', 'svelte'),
    alternative: 'svelte-runes',
    alternativeLead: 'Runes',
  },
  adapter('Solid', 'solid', 'useStore($cart)'),
  adapter('Lit', 'lit', 'new StoreController(this, $cart)'),
  adapter('Angular', 'angular', 'nanostores.useStore($cart)'),
  adapter('Alpine.js', 'alpine', 'x-nano:cart="$cart"'),
  {
    ...builtIn(
      'Vanilla JS · Web Components',
      '$cart.subscribe(render)',
      'vanilla-js',
    ),
    alternative: 'nanotags',
    alternativeLead: 'Components',
  },
]

// Order is a hypothesis: the worries people raise most often when choosing come first.
const capabilities: RowInput[] = [
  {
    id: 'persistence',
    title: 'Persistence',
    text: 'Swap atom for persistentJSON. The value is saved to localStorage, and other open tabs get every change.',
    plugin: 'persistent',
    snippets: [{ file: 'ecosystem/persistence.ts', caption: 'stores/cart.ts' }],
    boundary:
      'On the server there is no localStorage: the store starts from its initial value.',
  },
  {
    id: 'data-fetching',
    title: 'Data fetching',
    text: 'A fetcher store loads on the first subscriber, caches by key and shares the result. Every widget just reads $products.',
    plugin: 'query',
    snippets: [{ file: 'ecosystem/query.ts', caption: 'stores/products.ts' }],
    boundary:
      'Already on TanStack Query? Keep it for server data and use stores for client state.',
  },
  {
    id: 'url',
    title: 'Routing',
    text: 'The router is a store of the current page. Read the query string as one more computed store.',
    plugin: 'router',
    alternative: 'qs',
    alternativeLead: 'Only the query string',
    snippets: [{ file: 'ecosystem/router.ts', caption: 'stores/router.ts' }],
  },
  {
    id: 'i18n',
    title: 'Translations',
    text: 'Components declare their strings in the base language. Translations for the current locale load on demand.',
    plugin: 'i18n',
    snippets: [{ file: 'ecosystem/i18n.ts', caption: 'stores/i18n.ts' }],
  },
  {
    id: 'media-query',
    title: 'Media queries',
    text: 'No plugin needed. onMount starts listening when the first component subscribes and stops after the last one leaves.',
    module: {
      name: 'onMount',
      href: '/docs/api/#onmount',
      note: 'core',
    },
    alternative: 'media-query',
    alternativeLead: 'Ready-made store',
    snippets: [
      { file: 'ecosystem/media-query.ts', caption: 'stores/layout.ts' },
    ],
  },
  {
    id: 'nested-state',
    title: 'Nested state',
    text: 'Update a field by its path instead of copying the whole object by hand.',
    plugin: 'deepmap',
    snippets: [
      { file: 'ecosystem/nested-form.ts', caption: 'stores/checkout.ts' },
    ],
    boundary: 'Flat object? map in the core has setKey too.',
  },
]

const devtoolsRows: RowInput[] = [
  {
    id: 'redux-devtools',
    indexTitle: 'Redux DevTools',
    featured: true,
    title: 'Which line wrote this value?',
    text: 'Every store appears in the Redux DevTools panel, named after the variable you wrote. Each change gets its own timeline row with a diff and a stack trace to the line that wrote it.',
    plugin: 'nanostores-devtools',
    points: [
      'No setup per store',
      'Dev builds only — production gets empty functions',
      'Vite, webpack, Rspack · trackStores() elsewhere',
    ],
    snippets: [
      { file: 'ecosystem/devtools-vite.ts', caption: 'vite.config.ts' },
      { file: 'ecosystem/devtools-connect.ts', caption: 'main.ts' },
    ],
  },
  {
    id: 'logger',
    indexTitle: 'Logger',
    title: 'Print every change to the console',
    text: 'No browser extension: store changes and lifecycle events appear in the console under the names you pass.',
    plugin: 'logger',
    snippets: [{ file: 'ecosystem/logger.ts', caption: 'dev.ts' }],
  },
  {
    id: 'vue-devtools',
    indexTitle: 'Vue Devtools',
    title: 'Already working in Vue Devtools?',
    text: 'The Vue integration adds your stores to the Vue Devtools panel.',
    plugin: 'vue-devtools',
  },
]

export async function getEcosystemGroups() {
  const plugins = await getCollection('plugins')
  const situations = await getCollection('situations')
  const plugin = async (id: string) => {
    const entry = await getEntry('plugins', id)
    if (!entry) throw Error(`Missing plugin: ${id}`)
    return entry
  }
  const docsPage = new Map(
    pluginDocs.map((p) => [p.id, `/docs/ecosystem/${p.slug}/`]),
  )
  const toModule = (entry: (typeof plugins)[number]): Module => ({
    name: entry.data.package,
    href: docsPage.get(entry.id) ?? entry.data.docs,
    note: entry.data.maintainer,
  })
  const resolve = async (row: RowInput) => {
    const entry = row.plugin ? await plugin(row.plugin) : null
    const module = row.module ?? (entry ? toModule(entry) : null)
    if (!module) throw Error(`Row without a module: ${row.title}`)
    return {
      ...row,
      module,
      alternative: row.alternative
        ? toModule(await plugin(row.alternative))
        : null,
      usedIn: row.plugin
        ? situations.filter((s) =>
            s.data.deep.plugins.some((p) => p.id === row.plugin),
          )
        : [],
    }
  }

  const shown = new Set(
    [...frameworks, ...capabilities, ...devtoolsRows].flatMap((r) => [
      r.plugin,
      r.alternative,
    ]),
  )
  const more: RowInput[] = plugins
    .filter((p) => !shown.has(p.id))
    .sort(
      (a, b) =>
        Number(a.data.maintainer === 'community') -
          Number(b.data.maintainer === 'community') ||
        a.data.name.localeCompare(b.data.name),
    )
    .map((p) => ({ title: p.data.purpose, plugin: p.id }))

  return [
    {
      id: 'frameworks',
      title: 'Framework adapters',
      lead: null,
      link: {
        href: '/for/multi-framework/',
        text: 'One state for several frameworks →',
      },
      compact: true,
      tone: null,
      rows: await Promise.all(frameworks.map(resolve)),
      more: [],
      boundary: null,
    },
    {
      id: 'capabilities',
      title: 'Store utilities',
      lead: 'Persistence, data fetching, routing, translations, media queries, and nested state.',
      link: null,
      compact: false,
      tone: null,
      rows: await Promise.all(capabilities.map(resolve)),
      more: await Promise.all(more.map(resolve)),
      boundary: null,
    },
    {
      id: 'devtools',
      title: 'Devtools',
      lead: 'Your stores in the Redux DevTools panel, named for you. Or a plain console log when that is enough.',
      link: null,
      compact: false,
      tone: 'ink',
      rows: await Promise.all(devtoolsRows.map(resolve)),
      more: [],
      boundary: {
        text: 'nanostores-devtools only reads state, so there is no time travel.',
        strong:
          'Built your workflow around it? Redux Toolkit is the stronger fit.',
      },
    },
  ]
}
