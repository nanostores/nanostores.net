import instrument from '@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2?url'

export const basePreloads = [instrument]

export const fontPreload = (href: string) => ({
  rel: 'preload',
  href,
  as: 'font',
  type: 'font/woff2',
  crossorigin: '',
})
