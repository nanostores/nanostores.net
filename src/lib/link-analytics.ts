import { track } from './analytics'

// One delegated listener per activation type, shared by marketing and docs.
export function trackLink(event: MouseEvent) {
  if (event.defaultPrevented) return
  if (event.type === 'click' ? event.button !== 0 : event.button !== 1) return
  if (!(event.target instanceof Element)) return
  const link = event.target.closest<HTMLAnchorElement>(
    'a[data-track="outbound_click"]',
  )
  if (!link) return
  if (
    link.origin === location.origin ||
    !['https:', 'http:'].includes(link.protocol)
  )
    return
  track('outbound_click', {
    package: link.dataset.package,
    target: link.href,
  })
}
