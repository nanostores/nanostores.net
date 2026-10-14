import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

export const onRequest = defineRouteMiddleware(({ url, locals }) => {
  if (url.pathname.replace(/\/+$/, '') !== '/docs/api') return
  // The API index and shared sidebar already link to each public section.
  locals.starlightRoute.toc = undefined
})
