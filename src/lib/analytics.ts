import { order } from '../config/order'
import { init, track as plausibleTrack } from '@plausible-analytics/tracker'

export type EventName =
  | 'section_view'
  | 'section_dwell'
  | 'cta_click'
  | 'install_copy'
  | 'content_expand'
  | 'package_click'
export type EventProps = {
  situationId?: string
  ms?: number
  target?: string
  from?: string
  placement?: string
  package?: string
  contentType?: 'code' | 'objections'
}
export type TrackedProps = Omit<EventProps, 'situationId'> & {
  situationId: string | null
  position: number | null
  page: string
}
export interface Adapter {
  send(event: EventName, props: TrackedProps, options: EventOptions): void
}
export type EventOptions = { interactive: boolean }
export const consoleAdapter: Adapter = {
  send: (event, props) => console.info('[Nano Stores]', event, props),
}
export const noopAdapter: Adapter = { send: () => {} }
function plausibleProps(props: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(props)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  )
}

export const plausibleAdapter: Adapter = {
  send(event, props, options) {
    plausibleTrack(event, { props: plausibleProps(props), ...options })
  },
}

function pageProps() {
  const situationId = location.pathname.match(/^\/for\/([^/]+)\/?$/)?.[1]
  const index = situationId ? order.indexOf(situationId) : -1
  const referrer = document.referrer ? new URL(document.referrer) : null
  return plausibleProps({
    page: location.pathname,
    situationId,
    position: index >= 0 ? index + 1 : undefined,
    from: !referrer
      ? 'direct'
      : referrer.origin !== location.origin
        ? 'external'
        : referrer.pathname === '/'
          ? 'home'
          : 'internal',
  })
}

let adapter: Adapter = import.meta.env.DEV ? consoleAdapter : noopAdapter
// Every browser entry imports this module. ESM initializes it once, before any
// immediate section events, regardless of Astro's script ordering.
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  location.origin === 'https://nanostores.net'
) {
  init({
    domain: 'nanostores.net',
    autoCapturePageviews: true,
    outboundLinks: false,
    fileDownloads: false,
    formSubmissions: false,
    customProperties: (event) => (event === 'pageview' ? pageProps() : {}),
  })
  adapter = plausibleAdapter
}
export function setAdapter(next: Adapter) {
  adapter = next
}
export function track(event: EventName, props: EventProps = {}) {
  const { situationId: inputId, ...details } = props
  const situationId = inputId ?? null
  const index = situationId ? order.indexOf(situationId) : -1
  const tracked = {
    ...details,
    situationId,
    position: index >= 0 ? index + 1 : null,
    page: location.pathname,
  }
  adapter.send(event, tracked, {
    interactive: !['section_view', 'section_dwell'].includes(event),
  })
}
