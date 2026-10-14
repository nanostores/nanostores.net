import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

export const onRequest = defineRouteMiddleware(({ url, locals }) => {
  if (url.pathname.replace(/\/+$/, '') !== '/docs/api') return

  // The detailed API index already links to every section and public API.
  locals.starlightRoute.toc = undefined
})
