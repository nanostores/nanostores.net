// Shared with Starlight's public ThemeProvider override; runs before first
// paint. The site has no theme picker: it always follows the system.
;(() => {
  const media = matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
  }
  window.StarlightThemeProvider = { updatePickers() {} }
  apply()
  media.addEventListener('change', apply)
  // The search shortcut shows ⌘ on Apple devices from the first paint.
  if (/(Mac|iPhone|iPad|iPod)/i.test(navigator.platform)) {
    document.documentElement.dataset.platform = 'apple'
  }
})()
