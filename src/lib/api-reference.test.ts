import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  apiGroupProblems,
  apiAnchor,
  apiLink,
  apiMemberAnchor,
  readApiExports,
  type ApiExport,
} from './api-reference'

const exports = readApiExports(
  fileURLToPath(
    new URL('../../tests/fixtures/api-reference.d.ts', import.meta.url),
  ),
)

const fn = (deprecated = false): ApiExport => ({
  kind: 'functions',
  summary: '',
  deprecated,
})

describe('API reference helpers', () => {
  it('reports missing, unknown, repeated and misplaced exports', () => {
    const demo = new Map([
      ['create', fn()],
      ['update', fn()],
      ['legacy', fn(true)],
    ])
    expect(
      apiGroupProblems(
        [
          { label: 'Stores', names: ['create', 'create', 'legacy', 'unknown'] },
          { label: 'Deprecated', names: [] },
        ],
        demo,
      ),
    ).toEqual([
      'create is listed twice',
      'legacy is deprecated; move it to Deprecated',
      'unknown is not exported by nanostores',
      'update is missing from the API groups',
    ])
  })

  it('reads declaration kinds, first sentences, deprecation and inherited member owners', () => {
    expect(exports.get('create')).toEqual({
      kind: 'functions',
      summary: 'Create a value.',
      deprecated: false,
    })
    expect(exports.get('legacy')?.deprecated).toBe(true)
    expect(exports.get('Value')?.kind).toBe('type-aliases')
    expect(exports.get('ReadableStore')).toMatchObject({
      kind: 'interfaces',
      members: [{ name: 'get', owner: 'ReadableStore' }],
    })
    expect(exports.get('WritableStore')?.members).toEqual(
      expect.arrayContaining([
        { name: 'get', owner: 'ReadableStore' },
        { name: 'set', owner: 'WritableStore' },
      ]),
    )
  })

  it('reads callable descriptions and overloads from their interface', () => {
    const derive = exports.get('derive')!
    expect(derive).toMatchObject({
      kind: 'variables',
      summary: 'Derive a value.',
    })
    expect(derive.callable?.description).toContain('```ts\nderive(1)\n```')
    expect(derive.callable?.signatures).toEqual([
      {
        code: 'derive(value: string): ReadableStore',
        deprecated: 'Pass a number instead.',
      },
      { code: 'derive(value: number): ReadableStore', deprecated: '' },
    ])
  })

  it('disambiguates runtime/type anchors and links to store method definitions', () => {
    const names = ['atom', 'Atom', 'task', 'Task', 'mapCreator', 'MapCreator']
    expect(new Set(names.map(apiAnchor)).size).toBe(names.length)
    expect(apiLink('atom')).toBe('/docs/api/#atom')
    expect(apiAnchor('Atom')).toBe('type-atom')
    expect(apiAnchor('STORE_UNMOUNT_DELAY')).toBe('store_unmount_delay')
    expect(apiMemberAnchor('ReadableAtom', 'subscribe')).toBe('store-subscribe')
    expect(apiMemberAnchor('ReadableAtom', 'value')).toBe(
      'type-readableatom-value',
    )
  })
})
