import instrument from '@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2?url'

// Every page sets its first screen in Instrument Sans.
export const basePreloads = [instrument]

/*
 * Leaf pages render these attributes in FontPreloads, docs in the route
 * middleware. A preload whose crossorigin differs from the font request
 * downloads the font twice.
 */
export const fontPreload = (href: string) => ({
  rel: 'preload',
  href,
  as: 'font',
  type: 'font/woff2',
  crossorigin: '',
})
