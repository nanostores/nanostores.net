import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { coreSize, readmePages } from './readme-docs'
import { withFacts } from './readme'

const readme = readFileSync('.upstream/nanostores/README.md', 'utf8')
const sha = 'c0ffee'
describe('README docs', () => {
  it('turns README sections into pages', () => {
    const atoms = readmePages(readme, sha).find(
      (page) => page.id === 'docs/concepts/atoms',
    )
    expect(atoms?.title).toBe('Atoms')
    expect(atoms?.body).toContain("import { atom } from 'nanostores'")
    expect(atoms?.body).toContain('](/docs/concepts/effects/)')
    expect(atoms?.body).toContain('](/docs/frameworks/react-preact/)')
    expect(atoms?.body).toContain(
      '[router]: https://github.com/nanostores/router',
    )
  })

  it('orders guides from several README sections', () => {
    const guides = readmePages(readme, sha).filter((page) =>
      page.id.startsWith('docs/guides/'),
    )
    expect(guides.map((page) => [page.id, page.order])).toEqual([
      ['docs/guides/server-side-rendering', 1],
      ['docs/guides/tests', 2],
    ])
  })

  it('puts best practices into the handbook', () => {
    const handbook = readmePages(readme, sha).filter((page) =>
      page.id.startsWith('docs/handbook/'),
    )
    expect(handbook.map((page) => [page.id, page.order])).toEqual([
      ['docs/handbook/move-logic-from-components-to-stores', 1],
      ['docs/handbook/separate-changes-and-reaction', 2],
      ['docs/handbook/reduce-get-usage-outside-of-tests', 3],
    ])
  })

  it('fails when a listed heading is missing', () => {
    expect(() =>
      readmePages(readme.replace('### Atoms', '### Atom stores'), sha),
    ).toThrow('README has no "### Atoms"')
  })

  it('reads the core size and fills content facts', () => {
    expect(coreSize('Between 12 and 34 bytes')).toBe('12–34 bytes')
    expect(withFacts('Only {coreSize}.')).toBe(`Only ${coreSize(readme)}.`)
    expect(() => withFacts('{unknown}')).toThrow('Unknown fact {unknown}')
    expect(() => coreSize('# Nano Stores')).toThrow('Between N and M bytes')
  })
})
