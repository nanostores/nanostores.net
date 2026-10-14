import { expect, test } from 'vitest'
import {
  linkProblem,
  markdownLinks,
  readPage,
} from '../../scripts/build-links.mjs'

const site = new URL('https://example.test/')
const files = new Set([
  'index.html',
  'docs/index.html',
  'docs/api/index.html',
  '404.html',
  'llms.txt',
])
const anchors = new Map([
  ['docs/index.html', new Set(['intro', 'two words', 'a&b'])],
  ['docs/api/index.html', new Set(['atom'])],
])

test.each([
  '#intro',
  '#two%20words',
  '?source=nav#intro',
  '/docs/#intro',
  './api/#atom',
  '../docs/api/#atom',
  '/docs/api?source=nav#atom',
  '/docs/api/index.html#atom',
  'https://example.test/docs/api/#atom',
  '//example.test/docs/api/#atom',
  '/404.html',
  '/llms.txt',
  '/',
  '',
  '#top',
  '#:~:text=Introduction',
  '#intro:~:text=Introduction',
])('resolves local link %s from its source page', (href) => {
  expect(linkProblem(href, '/docs/', site, files, anchors)).toBeUndefined()
})

test.each([
  ['/missing/', 'missing page or linked file'],
  ['./missing/', 'missing page or linked file'],
  ['/docs/#missing', 'missing anchor'],
  ['#missing', 'missing anchor'],
  ['./api/#missing', 'missing anchor'],
  ['https://example.test/docs/#missing', 'missing anchor'],
  ['/docs/%ZZ', 'invalid URL or encoding'],
  ['#%ZZ', 'invalid URL or encoding'],
])('reports broken link %s', (href, problem) => {
  expect(linkProblem(href, '/docs/', site, files, anchors)).toBe(problem)
})

test.each([
  'https://external.test/missing/#missing',
  '//external.test/missing/',
  'mailto:hello@example.test',
  'tel:+123456789',
])('does not check external link %s', (href) => {
  expect(linkProblem(href, '/docs/', site, files, anchors)).toBeUndefined()
})

test('reads HTML links and anchors without treating scripts or assets as navigation', () => {
  const page = readPage(`
    <link rel="canonical" href="https://example.test/docs/">
    <link rel="stylesheet" href="/missing.css">
    <script>const example = '<a href="/fake/">';</script>
    <h2 id="a&amp;b">Heading</h2>
    <a name="legacy"></a>
    <a href='#a&amp;b'>Heading</a>
    <area href="./api/#atom">
    <img src="/missing.png">
  `)
  expect(page.canonical).toBe('https://example.test/docs/')
  expect(page.links).toEqual(['#a&b', './api/#atom'])
  expect(page.anchors).toEqual(new Set(['a&b', 'legacy']))
  expect(
    linkProblem(page.links[0], '/docs/', site, files, anchors),
  ).toBeUndefined()
})

test('keeps duplicate API ids visible to the output checker', () => {
  expect(readPage('<h2 id="atom">Atom</h2><a id="atom"></a>').ids).toEqual([
    'atom',
    'atom',
  ])
})

test('reads documentation links including references and ignores code examples', () => {
  expect(
    markdownLinks(
      [
        '[API](/docs/api/#atom)',
        '[Guide][guide]',
        '',
        '[guide]: /docs/getting-started/',
        '',
        '```md',
        '[Fake](/missing/)',
        '```',
        '',
        '<a href="/docs/">Docs</a>',
      ].join('\n'),
    ),
  ).toEqual(['/docs/api/#atom', '/docs/getting-started/', '/docs/'])
})
