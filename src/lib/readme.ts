import readme from '../vendor/nanostores-readme.md?raw'
import { coreSize, readmeUrl } from './readme-docs'
import npm from '../vendor/npm-downloads.json'

// Weekly npm downloads as people say them: 11.8M, 950K.
export function shortCount(count: number): string {
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`
  if (count >= 1e3) return `${Math.round(count / 1e3)}K`
  return String(count)
}

// Facts the site quotes from the vendored README and npm stats. Content
// uses them as `{coreSize}` so the numbers follow `pnpm run sync:readme`
// and `pnpm run sync:downloads`.
export const facts: Record<string, string> = {
  coreSize: coreSize(readme),
  readmeUrl: readmeUrl(readme),
  weeklyDownloads: shortCount(npm.downloads),
}

export function withFacts(text: string): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in facts)) throw new Error(`Unknown fact {${key}} in "${text}"`)
    return facts[key]
  })
}
