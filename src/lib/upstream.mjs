// Upstream repositories the docs are built from, listed in
// src/config/upstream.json. scripts/fetch-upstream.mjs downloads them into
// .upstream/; the site only reads their files and never runs their code.
// Plain .mjs so that the script and the site share these functions.

const ID = /^[a-z0-9-]+$/
const REPO = /^[\w.-]+\/[\w.-]+$/
const SHA = /^[0-9a-f]{40}$/

/**
 * @param {unknown} data
 * @returns {{ id: string, repo: string }[]}
 */
export function parseUpstream(data) {
  const fail = (message) => {
    throw new Error(`src/config/upstream.json is invalid: ${message}`)
  }
  if (!Array.isArray(data)) fail('expected an array')
  const ids = new Set()
  for (const entry of data) {
    const where = JSON.stringify(entry)
    if (typeof entry !== 'object' || entry === null) fail(`${where}`)
    const { id, repo, ...rest } = entry
    if (typeof id !== 'string' || !ID.test(id)) fail(`bad "id" in ${where}`)
    if (typeof repo !== 'string' || !REPO.test(repo)) {
      fail(`bad "repo" in ${where}`)
    }
    if (Object.keys(rest).length) fail(`unknown fields in ${where}`)
    if (ids.has(id)) fail(`duplicate id ${id}`)
    ids.add(id)
  }
  return data
}

// UPSTREAM_PINS holds commits to build instead of the latest ones, as JSON:
// {"nanostores":"<full SHA>"}. It is a repository variable, so a rollback
// needs no commit.
/**
 * @param {string | undefined} text
 * @param {{ id: string }[]} upstream
 * @returns {Map<string, string>}
 */
export function parsePins(text, upstream) {
  const pins = new Map()
  if (!text?.trim()) return pins
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('UPSTREAM_PINS is not JSON')
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('UPSTREAM_PINS must be an object of id → commit SHA')
  }
  const ids = new Set(upstream.map((entry) => entry.id))
  for (const [id, sha] of Object.entries(data)) {
    if (!ids.has(id)) throw new Error(`UPSTREAM_PINS: unknown id ${id}`)
    if (typeof sha !== 'string' || !SHA.test(sha)) {
      throw new Error(`UPSTREAM_PINS: ${id} needs a full commit SHA`)
    }
    pins.set(id, sha)
  }
  return pins
}
