import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import mono from '@fontsource/fragment-mono/files/fragment-mono-latin-400-normal.woff2?url'
import { basePreloads, fontPreload } from './font-preloads'

export const onRequest = defineRouteMiddleware(({ locals }) => {
  const route = locals.starlightRoute
  const api = route.id === 'docs/api'
  const fonts = api ? [...basePreloads, mono] : basePreloads
  for (const href of fonts) {
    route.head.push({ tag: 'link', attrs: fontPreload(href) })
  }
  // The API index and shared sidebar already link to each public section.
  if (api) route.toc = undefined
})
