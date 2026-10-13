import { expect, it } from 'vitest'
import { showRegions } from './snippet-regions'

it('shows one region of code, dedented', () => {
  expect(
    showRegions(
      [
        'import { a } from "a"',
        '  // #region show',
        '  a()',
        '  // #endregion',
      ].join('\n'),
    ),
  ).toBe('a()')
})

it('joins several regions with markup and code markers', () => {
  const vue = [
    '<!-- #region show -->',
    '<script setup lang="ts">',
    '// #endregion',
    "import { useStore } from '@nanostores/vue'",
    '// #region show',
    'const cart = useStore($cart)',
    '</script>',
    '<template>{{ cart.length }}</template>',
    '<!-- #endregion -->',
  ].join('\n')
  expect(showRegions(vue)).toBe(
    [
      '<script setup lang="ts">',
      'const cart = useStore($cart)',
      '</script>',
      '<template>{{ cart.length }}</template>',
    ].join('\n'),
  )
})

it('shows nothing without markers', () => {
  expect(showRegions('const a = 1')).toBe('')
})
