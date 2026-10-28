import { order } from '../config/order'
import { init, track as plausibleTrack } from '@plausible-analytics/tracker'

export type EventName = 'outbound_click' | 'install_copy' | 'content_expand'
export type EventProps = {
  situationId?: string
  target?: string
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

// `import.meta.env.DEV` is set by `astro dev` and inlined into the bundle at
// build time, so the Docker image needs no environment variables. Only the
// production build on nanostores.net sends events: preview builds and other
// hosts get a no-op, dev logs to the console.
function pickAdapter(): Adapter {
  if (import.meta.env.DEV) return consoleAdapter
  if (
    typeof window === 'undefined' ||
    location.origin !== 'https://nanostores.net'
  ) {
    return noopAdapter
  }
  init({
    domain: 'nanostores.net',
    endpoint: '/api/event',
    autoCapturePageviews: true,
    outboundLinks: false,
    fileDownloads: false,
    formSubmissions: false,
    customProperties: (event) => (event === 'pageview' ? pageProps() : {}),
  })
  return plausibleAdapter
}

// Every browser entry imports this module. ESM initializes it once, before any
// custom events, regardless of Astro's script ordering.
let adapter = pickAdapter()
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
  adapter.send(event, tracked, { interactive: true })
}
