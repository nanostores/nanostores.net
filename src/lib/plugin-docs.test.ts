import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parsePluginDocs, pluginDocs } from './plugin-config'
import { coreRoutes } from './readme-docs'
import { pluginPage, type PluginSource } from './plugin-docs'
import { upstreamRevision } from './upstream-revisions'
import { relativeImagePaths } from './plugin-images.mjs'

const plugin: PluginSource = {
  id: 'demo',
  label: 'Demo',
  slug: 'demo',
  package: '@nanostores/demo',
  repo: 'nanostores/demo',
  sha: 'c0ffee',
}

const logo = `<img align="right" width="92" height="92" title="Nano Stores logo"
     src="https://nanostores.github.io/nanostores/logo.svg">`
const madeAt = `---

<img src="https://cdn.evilmartians.com/badges/logo-no-label.svg" alt="" /> Made at <b><a href="https://evilmartians.com/devtools?utm_source=x">Evil Martians</a></b>

---`
const sponsor = `<a href="https://evilmartians.com/?utm_source=x">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>`

describe('plugin docs', () => {
  it('drops the H1 and the logo and takes the description', () => {
    const page = pluginPage(
      `# Nano Stores Demo\n\n${logo}\n\nA tiny [demo](https://x.test) store.\n\n## Install\n`,
      plugin,
      3,
    )
    expect(page.id).toBe('docs/ecosystem/demo')
    expect(page.title).toBe('Nano Stores Demo')
    expect(page.order).toBe(3)
    expect(page.description).toBe('A tiny demo store.')
    expect(page.body).not.toContain('# Nano Stores Demo')
    expect(page.body).not.toContain('<img')
    expect(page.body).toContain('## Install')
    expect(page.body).toContain(
      '*Imported from the [Nano Stores Demo README](https://github.com/nanostores/demo/blob/c0ffee/README.md). Improve this page there.*',
    )
  })

  it('removes a Made at block in the middle and keeps the text around it', () => {
    const page = pluginPage(
      `# Demo\n\nIntro text.\n\n${madeAt}\n\n## Install\n\nRun it.\n\n## License\n\nMIT`,
      plugin,
      1,
    )
    expect(page.body).not.toContain('Made at')
    expect(page.body).not.toContain('evilmartians.com')
    expect(page.body).toContain('Intro text.')
    expect(page.body).toContain('## Install')
    expect(page.body).toContain('## License')
  })

  it('removes the sponsor badge', () => {
    const page = pluginPage(
      `# Demo\n\nIntro.\n\n${sponsor}\n\n## Install\n`,
      plugin,
      1,
    )
    expect(page.body).not.toContain('sponsored-by-evil-martians')
    expect(page.body).not.toContain('<a href')
    expect(page.body).toContain('Intro.')
    expect(page.body).toContain('## Install')
  })

  it('keeps the text when there are no promo blocks', () => {
    const page = pluginPage(
      '# Demo\n\nIntro.\n\n## Install\n\nnpm i',
      plugin,
      1,
    )
    expect(page.body.startsWith('Intro.\n\n## Install\n\nnpm i\n\n---')).toBe(
      true,
    )
  })

  it('throws on a Made at line without --- around it', () => {
    expect(() =>
      pluginPage(
        '# Demo\n\nMade at <a href="https://evilmartians.com/">EM</a>\n\n## Install',
        plugin,
        1,
      ),
    ).toThrow(/Made at/)
  })

  it('makes relative links and images absolute with the right tag', () => {
    const query: PluginSource = { ...plugin, repo: 'nanostores/query' }
    const page = pluginPage(
      `# Demo

[MIT](./LICENSE.md) and [docs](docs/api.md) and [web](https://a.test/x) and [anchor](#how)

![shot](./docs/shot.png)

<picture>
  <source srcset="./docs/dark.png">
  <img alt="x" src="./docs/light.png">
</picture>`,
      query,
      1,
    )
    const blob = 'https://github.com/nanostores/query/blob/c0ffee'
    const local = '/vendor/upstream/demo'
    expect(page.body).toContain(`[MIT](${blob}/LICENSE.md)`)
    expect(page.body).toContain(`[docs](${blob}/docs/api.md)`)
    expect(page.body).toContain('[web](https://a.test/x)')
    expect(page.body).toContain('[anchor](#how)')
    expect(page.body).toContain(`![shot](${local}/docs/shot.png)`)
    expect(page.body).toContain(`srcset="${local}/docs/dark.png"`)
    expect(page.body).toContain(`src="${local}/docs/light.png"`)
  })

  it('keeps relative-looking text inside fenced code untouched', () => {
    const page = pluginPage(
      [
        '# Demo',
        '',
        '[MIT](./LICENSE.md)',
        '',
        '```ts',
        'handlers[key](event)',
        'const x = [a](./b)',
        '```',
        '',
        '~~~',
        'list[i](./c)',
        '~~~',
        '',
        '[docs](docs/api.md)',
      ].join('\n'),
      plugin,
      1,
    )
    expect(page.body).toContain('handlers[key](event)')
    expect(page.body).toContain('[a](./b)')
    expect(page.body).toContain('list[i](./c)')
    expect(page.body).toContain(
      '[MIT](https://github.com/nanostores/demo/blob/c0ffee/LICENSE.md)',
    )
    expect(page.body).toContain(
      '[docs](https://github.com/nanostores/demo/blob/c0ffee/docs/api.md)',
    )
  })

  it('links core README references to docs pages outside code', () => {
    const routes = new Map([['store-events', '/docs/concepts/store-events/']])
    const page = pluginPage(
      [
        '# Demo',
        '',
        '[events](https://github.com/nanostores/nanostores#store-events)',
        '[pinned](https://github.com/nanostores/nanostores/blob/1.5.4/README.md#store-events)',
        '[guide](https://github.com/nanostores/nanostores#guide)',
        '[readme](https://github.com/nanostores/nanostores#readme)',
        '[other](https://github.com/nanostores/other#store-events)',
        '',
        '```md',
        '[events](https://github.com/nanostores/nanostores#store-events)',
        '```',
      ].join('\n'),
      plugin,
      1,
      routes,
    )
    expect(page.body).toContain('[events](/docs/concepts/store-events/)')
    expect(page.body).toContain('[pinned](/docs/concepts/store-events/)')
    expect(page.body).toContain(
      '[guide](https://github.com/nanostores/nanostores#guide)',
    )
    expect(page.body).toContain(
      '[readme](https://github.com/nanostores/nanostores#readme)',
    )
    expect(page.body).toContain(
      '[other](https://github.com/nanostores/other#store-events)',
    )
    expect(page.body.match(/nanostores#store-events\)/g)?.length).toBe(1)
  })

  it('finds the core anchors that became docs pages', () => {
    const core = readFileSync('.upstream/nanostores/README.md', 'utf8')
    const routes = coreRoutes(core)
    expect(routes.get('store-events')).toBe('/docs/concepts/store-events/')
    expect(routes.has('guide')).toBe(false)
  })

  it('leaves logo-like images and promo inside code blocks alone', () => {
    const page = pluginPage(
      [
        '# Demo',
        '',
        logo,
        '',
        'Intro.',
        '',
        '```html',
        '<img src="logo.svg">',
        madeAt,
        sponsor,
        '```',
      ].join('\n'),
      plugin,
      1,
    )
    expect(page.body).not.toContain('Nano Stores logo')
    expect(page.body).toContain('<img src="logo.svg">')
    expect(page.body).toContain('Made at')
    expect(page.body).toContain('sponsored-by-evil-martians')
  })

  it('validates the plugin config', () => {
    const entry = {
      id: 'demo',
      label: 'Demo',
      slug: 'demo',
      package: '@nanostores/demo',
    }
    expect(parsePluginDocs([entry])).toEqual([entry])
    const { label: _label, ...withoutLabel } = entry
    expect(() => parsePluginDocs([withoutLabel])).toThrow(/label/)
    expect(() => parsePluginDocs([{ ...entry, slug: 'A b' }])).toThrow(/slug/)
  })

  it('passes the sidebar label', () => {
    expect(
      pluginPage(['# Demo', '', 'Text.'].join('\n'), plugin, 1).label,
    ).toBe('Demo')
  })
})

describe('upstream plugin READMEs', () => {
  const source = (item: (typeof pluginDocs)[number]) => ({
    ...item,
    ...upstreamRevision(item.id),
  })

  for (const item of pluginDocs) {
    it(`turns ${item.package} into a clean page`, () => {
      const readme = readFileSync(`.upstream/${item.id}/README.md`, 'utf8')
      const page = pluginPage(readme, source(item), 1)
      expect(page.body.trim()).not.toBe('')
      expect(page.body).not.toContain('logo.svg"')
      expect(page.body).not.toContain('Made at')
      expect(page.body).not.toContain('sponsored-by-evil-martians')
      expect(page.body).not.toContain('srcset="./')
      expect(page.body).not.toContain('src="./')
      expect(page.body).not.toContain('](./')
      if (readme.includes('## License')) {
        expect(page.body).toContain('## License')
      }
    })
  }

  it('finds relative images only, outside code blocks and without the logo', () => {
    const readme = [
      '<img src="./logo.svg" title="logo">',
      '<img src="https://a.test/x.png">',
      '![a](./one.png) ![b](https://a.test/b.png) ![c](/abs.png)',
      '<picture><source srcset="dark/two.png"><img src="./three.png"></picture>',
      '```html',
      '<img src="./code.png">',
      '```',
    ].join('\n')
    expect(relativeImagePaths(readme)).toEqual([
      'dark/two.png',
      'three.png',
      'one.png',
    ])
  })

  it('keeps Install in persistent, router and i18n', () => {
    for (const slug of ['persistent', 'router', 'i18n']) {
      const item = pluginDocs.find((p) => p.slug === slug)!
      const readme = readFileSync(`.upstream/${item.id}/README.md`, 'utf8')
      expect(pluginPage(readme, source(item), 1).body).toContain('## Install')
    }
  })
})
