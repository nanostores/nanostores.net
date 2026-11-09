import { describe, expect, it } from 'vitest'
import { parsePins, parseUpstream } from './upstream.mjs'
import rawUpstream from '../config/upstream.json'
import { pluginDocs } from './plugin-config'

const sha = 'a'.repeat(40)

describe('upstream config', () => {
  it('lists the core and every documented plugin', () => {
    const ids = parseUpstream(rawUpstream).map((entry) => entry.id)
    expect(ids).toContain('nanostores')
    for (const plugin of pluginDocs) expect(ids).toContain(plugin.id)
  })

  it('rejects broken entries', () => {
    const entry = { id: 'demo', repo: 'nanostores/demo' }
    expect(parseUpstream([entry, { ...entry, id: 'b' }])).toEqual([
      entry,
      { ...entry, id: 'b' },
    ])
    expect(() => parseUpstream([{ ...entry, repo: 'demo' }])).toThrow(/repo/)
    expect(() => parseUpstream([{ ...entry, id: 'A b' }])).toThrow(/id/)
    expect(() => parseUpstream([entry, entry])).toThrow(/duplicate/)
    expect(() => parseUpstream([{ ...entry, tag: 'v1' }])).toThrow(/unknown/)
  })
})

describe('upstream pins', () => {
  const upstream = [{ id: 'nanostores' }, { id: 'query' }]

  it('reads full SHAs by id', () => {
    expect(parsePins(undefined, upstream).size).toBe(0)
    expect(parsePins(' ', upstream).size).toBe(0)
    expect(parsePins(`{"query":"${sha}"}`, upstream)).toEqual(
      new Map([['query', sha]]),
    )
  })

  it('rejects unknown ids, short SHAs and broken JSON', () => {
    expect(() => parsePins(`{"other":"${sha}"}`, upstream)).toThrow(/unknown/)
    expect(() => parsePins('{"query":"abc123"}', upstream)).toThrow(/full/)
    expect(() => parsePins('{query', upstream)).toThrow(/JSON/)
    expect(() => parsePins(`["${sha}"]`, upstream)).toThrow(/object/)
  })
})
