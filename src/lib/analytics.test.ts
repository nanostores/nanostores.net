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
  track('cta_click')
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
  track('section_view', { situationId: 'islands' })
  track('install_copy', { situationId: 'islands' })
  await import('./analytics')
  expect(init).toHaveBeenCalledTimes(1)
  expect(vi.mocked(init).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(plausibleTrack).mock.invocationCallOrder[0]!,
  )
  expect(plausibleTrack).toHaveBeenNthCalledWith(1, 'section_view', {
    interactive: false,
    props: { situationId: 'islands', position: '2', page: '/for/islands/' },
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
  expect(properties('pageview')).toEqual({
    page: '/for/islands/',
    situationId: 'islands',
    position: '2',
    from: 'direct',
  })
  expect(properties('install_copy')).toEqual({})
})

it('does not count observations as interactions or serialize absent values', async () => {
  vi.stubEnv('PROD', true)
  browser('https://nanostores.net')
  const { track } = await import('./analytics')
  track('section_dwell', { situationId: 'islands', ms: 1250 })
  track('cta_click', {
    placement: 'header',
    target: '/docs/',
    package: undefined,
  })
  expect(plausibleTrack).toHaveBeenNthCalledWith(1, 'section_dwell', {
    interactive: false,
    props: { situationId: 'islands', position: '2', page: '/', ms: '1250' },
  })
  expect(plausibleTrack).toHaveBeenNthCalledWith(2, 'cta_click', {
    interactive: true,
    props: { placement: 'header', target: '/docs/', page: '/' },
  })
})
