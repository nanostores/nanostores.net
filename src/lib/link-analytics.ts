import { track } from './analytics'

// One delegated listener per activation type, shared by marketing and docs.
export function trackLink(event: MouseEvent) {
  if (event.defaultPrevented) return
  if (event.type === 'click' ? event.button !== 0 : event.button !== 1) return
  if (!(event.target instanceof Element)) return
  const link = event.target.closest<HTMLAnchorElement>('a[data-track]')
  if (!link) return
  const name = link.dataset.track
  if (name !== 'cta_click' && name !== 'package_click') return
  const section = link.closest<HTMLElement>(
    '[data-situation-id], [data-deep-id]',
  )
  track(name, {
    situationId:
      link.dataset.situationId ??
      section?.dataset.situationId ??
      section?.dataset.deepId,
    placement: link.dataset.placement,
    package: link.dataset.package,
    target:
      link.origin === location.origin
        ? link.pathname + link.search + link.hash
        : link.href,
  })
}
