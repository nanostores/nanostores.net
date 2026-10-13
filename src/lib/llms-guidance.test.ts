import { describe, expect, it } from 'vitest'
import { extractLlmsGuidance } from './llms-guidance.mjs'

const start = '<!-- llms-guidance:start -->'
const end = '<!-- llms-guidance:end -->'

describe('handbook guidance for llms.txt', () => {
  it('extracts only the shared block and resolves site links, including fragments', () => {
    const markdown = `Unrelated introduction\n${start}\n
- [Stores](/docs/concepts/smart-stores/#ready-made-smart-stores)
- [Upstream](https://github.com/nanostores/nanostores)
\n${end}\nUnrelated chapter links`
    expect(extractLlmsGuidance(markdown, 'https://example.com/')).toBe(
      '- [Stores](https://example.com/docs/concepts/smart-stores/#ready-made-smart-stores)\n' +
        '- [Upstream](https://github.com/nanostores/nanostores)',
    )
  })

  it.each([
    'No block',
    `${start}Missing end`,
    `${start}One${end}${start}Two${end}`,
    `${end}Reversed${start}`,
    `${start}\n \n${end}`,
  ])(
    'fails rather than silently publishing missing or ambiguous guidance: %s',
    (markdown) => {
      expect(() =>
        extractLlmsGuidance(markdown, 'https://example.com/'),
      ).toThrow(/Handbook/)
    },
  )
})
