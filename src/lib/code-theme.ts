import { createCssVariablesTheme } from 'shiki'

// Real sRGB equivalents of the exact reference OKLCH roles, for Expressive Code.
export const codeColors = {
  background: '#f3e9d7',
  foreground: '#28160b',
  keyword: '#5c483b',
  string: '#1a469d',
  function: '#28160b',
  comment: '#5c483b',
}
const darkColors = {
  background: '#231a12',
  foreground: '#f5eee0',
  keyword: '#dad0be',
  string: '#aed4ff',
  function: '#f5eee0',
  comment: '#dad0be',
}
const makeTheme = (type: 'light' | 'dark', colors: typeof codeColors) => ({
  name: `nanostores-${type}`,
  type,
  colors: {
    'editor.background': colors.background,
    'editor.foreground': colors.foreground,
  },
  tokenColors: [
    { scope: ['comment'], settings: { foreground: colors.comment } },
    { scope: ['keyword', 'storage'], settings: { foreground: colors.keyword } },
    { scope: ['string'], settings: { foreground: colors.string } },
    {
      scope: ['entity.name.function'],
      settings: { foreground: colors.function },
    },
  ],
})
export const codeTheme = makeTheme('light', codeColors)
export const codeDarkTheme = makeTheme('dark', darkColors)
export const siteCodeTheme = createCssVariablesTheme({
  name: 'nanostores-site',
  variablePrefix: '--code-',
  fontStyle: false,
})
