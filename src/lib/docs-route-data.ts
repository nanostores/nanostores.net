import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import { apiGroups } from '../config/api-groups'
import { apiNavigation } from './api-reference'

export const onRequest = defineRouteMiddleware(({ url, locals }) => {
  const path = url.pathname.replace(/\/+$/, '')
  const active =
    path === '/docs/api'
      ? 'API'
      : path.startsWith('/docs/ecosystem')
        ? 'Ecosystem'
        : 'Docs'
  const { sidebar, pagination } = locals.starlightRoute
  for (const entry of sidebar) {
    if (entry.type !== 'group') continue
    entry.collapsed = entry.label !== active
    if (entry.label !== 'API') continue
    // Add page-local links after Starlight calculates page pagination.
    entry.entries.push(
      ...apiNavigation(apiGroups).map((group) => ({
        type: 'group' as const,
        label: group.label,
        collapsed: group.label === 'Types' || group.label === 'Deprecated',
        badge: undefined,
        entries: group.items.map(({ label, anchor }) => ({
          type: 'link' as const,
          label,
          href: `/docs/api/#${anchor}`,
          isCurrent: false,
          attrs: {},
          badge: undefined,
        })),
      })),
    )
  }
  // External navigation is not a next documentation page.
  if (pagination.next?.href.startsWith('https://')) pagination.next = undefined
  if (active !== 'API') return
  // The detailed API index already links to every section and public API.
  locals.starlightRoute.toc = undefined
})
