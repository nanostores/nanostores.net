import { readFileSync } from 'node:fs'

const start = '<!-- llms-guidance:start -->'
const end = '<!-- llms-guidance:end -->'

/**
 * Copy the handbook's curated guidance into llms.txt without a second source
 * of recommendations. Root-relative Markdown links use the canonical site URL.
 * @param {string} markdown
 * @param {string} siteUrl
 */
export function extractLlmsGuidance(markdown, siteUrl) {
  if (markdown.split(start).length !== 2 || markdown.split(end).length !== 2) {
    throw new Error('Handbook must contain exactly one llms-guidance block')
  }
  const startIndex = markdown.indexOf(start) + start.length
  const endIndex = markdown.indexOf(end)
  const guidance = markdown.slice(startIndex, endIndex).trim()
  if (endIndex < startIndex || !guidance) {
    throw new Error(
      'Handbook llms-guidance block must not be reversed or empty',
    )
  }
  return guidance.replace(/\]\((\/(?!\/)[^\s)]+)\)/g, (_, path) => {
    return `](${new URL(path, siteUrl).href})`
  })
}

/** @param {string} siteUrl */
export function readLlmsGuidance(siteUrl) {
  const handbook = readFileSync(
    new URL('../content/docs/docs/handbook/index.md', import.meta.url),
    'utf8',
  )
  return extractLlmsGuidance(handbook, siteUrl)
}
