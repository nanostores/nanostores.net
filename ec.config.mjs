// Public Expressive Code config supports hooks used by the MDX Code component.
import { docsStoreMarkers } from './src/lib/docs-code.ts'
import { codeTheme, codeDarkTheme } from './src/lib/code-theme.ts'
export default {
  themes: [codeTheme, codeDarkTheme],
  plugins: [docsStoreMarkers],
  useStarlightDarkModeSwitch: true,
  useStarlightUiThemeColors: false,
  styleOverrides: {
    // Expressive Code adds its 1px border to the rendered corner radius.
    borderRadius: '7px',
    borderColor: 'var(--line)',
    codeBackground: 'var(--surface-raised)',
    codeForeground: 'var(--text)',
    codeFontFamily: "'Fragment Mono', ui-monospace, monospace",
    codeFontSize: '13px',
    codeLineHeight: '1.65',
    codePaddingInline: '18px',
    codePaddingBlock: '18px',
    frames: {
      shadowColor: 'transparent',
      editorBackground: 'var(--surface-raised)',
    },
  },
}
