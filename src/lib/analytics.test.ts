import { afterEach, expect, it, vi } from 'vitest'
import { init, track as plausibleTrack } from '@plausible-analytics/tracker'

vi.mock('@plausible-analytics/tracker', () => ({
  init: vi.fn(),
  track: vi.fn(),
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.resetModules()
})

function browser(origin: string, pathname = '/') {
  vi.stubGlobal('window', {})
  vi.stubGlobal('location', { origin, pathname })
  vi.stubGlobal('document', { referrer: '' })
}

it.each([
  'http://localhost:4321',
  'https://preview-42.nanostores.hplush.dev',
  'https://example.com',
  'http://nanostores.net',
])('does not send production events from %s', async (origin) => {
  vi.stubEnv('PROD', true)
  vi.stubEnv('DEV', false)
  browser(origin)
  const { track } = await import('./analytics')
  track('outbound_click', {
    target: 'https://github.com/nanostores/nanostores',
  })
  expect(init).not.toHaveBeenCalled()
  expect(plausibleTrack).not.toHaveBeenCalled()
})

it('does not initialize during server rendering', async () => {
  vi.stubEnv('PROD', true)
  vi.stubGlobal('window', undefined)
  await import('./analytics')
  expect(init).not.toHaveBeenCalled()
})

it('initializes once before immediate events and sends serializable properties', async () => {
  vi.stubEnv('PROD', true)
  browser('https://nanostores.net', '/for/islands/')
  const { track } = await import('./analytics')
  track('content_expand', { situationId: 'islands', contentType: 'code' })
  track('install_copy', { situationId: 'islands' })
  await import('./analytics')
  expect(init).toHaveBeenCalledTimes(1)
  expect(vi.mocked(init).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(plausibleTrack).mock.invocationCallOrder[0]!,
  )
  expect(plausibleTrack).toHaveBeenNthCalledWith(1, 'content_expand', {
    interactive: true,
    props: {
      situationId: 'islands',
      position: '2',
      page: '/for/islands/',
      contentType: 'code',
    },
  })
  expect(plausibleTrack).toHaveBeenNthCalledWith(2, 'install_copy', {
    interactive: true,
    props: { situationId: 'islands', position: '2', page: '/for/islands/' },
  })
  const config = vi.mocked(init).mock.calls[0]![0]
  const properties = config.customProperties as (
    event: string,
  ) => Record<string, string>
  expect(config.autoCapturePageviews).toBe(true)
  expect(config.endpoint).toBe('/api/event')
  expect(config.outboundLinks).toBe(false)
  expect(properties('pageview')).toEqual({
    page: '/for/islands/',
    situationId: 'islands',
    position: '2',
    from: 'direct',
  })
  expect(properties('install_copy')).toEqual({})
})

it('sends outbound destinations without absent context properties', async () => {
  vi.stubEnv('PROD', true)
  browser('https://nanostores.net')
  const { track } = await import('./analytics')
  track('outbound_click', {
    target: 'https://github.com/nanostores/nanostores',
    package: undefined,
  })
  expect(plausibleTrack).toHaveBeenCalledExactlyOnceWith('outbound_click', {
    interactive: true,
    props: { target: 'https://github.com/nanostores/nanostores', page: '/' },
  })
})

function linkEvent(
  href: string,
  options: {
    marked?: boolean
    type?: string
    button?: number
    defaultPrevented?: boolean
    package?: string
    ctrlKey?: boolean
    detail?: number
  } = {},
) {
  const url = new URL(href, 'https://nanostores.net')
  const link = {
    origin: url.origin,
    protocol: url.protocol,
    href: url.href,
    dataset: { package: options.package },
  }
  class Target {
    closest(selector: string) {
      return options.marked !== false &&
        selector === 'a[data-track="outbound_click"]'
        ? link
        : null
    }
  }
  vi.stubGlobal('Element', Target)
  return {
    type: 'click',
    button: 0,
    defaultPrevented: false,
    ...options,
    target: new Target(),
  } as unknown as MouseEvent
}

it.each([
  { href: '/docs/getting-started/' },
  { href: 'https://nanostores.net/docs/ecosystem/persistent/' },
  { href: '#packages' },
  { href: 'mailto:hello@example.com' },
  { href: 'https://example.com', marked: false },
  { href: 'https://github.com/nanostores/react', defaultPrevented: true },
  { href: 'https://github.com/nanostores/react', type: 'auxclick', button: 2 },
])(
  'ignores internal, unmarked or canceled link activation: %j',
  async ({ href, ...options }) => {
    vi.stubEnv('PROD', true)
    browser('https://nanostores.net', '/ecosystem/')
    const { trackLink } = await import('./link-analytics')
    trackLink(linkEvent(href, options))
    expect(plausibleTrack).not.toHaveBeenCalled()
  },
)

it.each([
  { type: 'click', button: 0 },
  { type: 'click', button: 0, detail: 0 },
  { type: 'click', button: 0, ctrlKey: true },
  { type: 'auxclick', button: 1 },
])('tracks one marked external package activation: %j', async (options) => {
  vi.stubEnv('PROD', true)
  browser('https://nanostores.net', '/ecosystem/')
  const { trackLink } = await import('./link-analytics')
  trackLink(
    linkEvent('https://github.com/nanostores/react#readme', {
      ...options,
      package: '@nanostores/react',
    }),
  )
  expect(plausibleTrack).toHaveBeenCalledExactlyOnceWith('outbound_click', {
    interactive: true,
    props: {
      page: '/ecosystem/',
      target: 'https://github.com/nanostores/react#readme',
      package: '@nanostores/react',
    },
  })
})
