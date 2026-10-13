import { afterEach, describe, expect, it, vi } from 'vitest'
import { $cart, addItem } from './islands/cart'
import { $user, $isAdmin } from './logic-outside-hooks/after'
import { $session, $signedIn, signOut } from './multi-framework/session'
import { $prices } from './live-connection/prices'
import { $isMobile } from './ecosystem/media-query'
import { $checkout, setCity } from './ecosystem/nested-form'
import { $users, addUser } from './getting-started/stores/users'
import { $admins } from './getting-started/stores/admins'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the snippets rendered on the site', () => {
  it('updates a second cart subscriber', () => {
    $cart.set([])
    const second = vi.fn()
    const stop = $cart.subscribe(second)
    addItem({ id: 'book', name: 'Book' })
    expect(second).toHaveBeenLastCalledWith(
      [{ id: 'book', name: 'Book' }],
      [],
      undefined,
    )
    stop()
  })

  it('derives admin status from the displayed user store', () => {
    vi.stubGlobal('fetchUser', () => new Promise(() => {}))
    $user.set(null)
    expect($isAdmin.get()).toBeFalsy()
    $user.set({ roles: ['admin'] })
    expect($isAdmin.get()).toBe(true)
    $user.set({ roles: ['editor'] })
    expect($isAdmin.get()).toBe(false)
  })

  it('signs out every session subscriber', async () => {
    const remoteSignOut = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('api', { signOut: remoteSignOut })
    $session.set({ name: 'Ada' })
    const first = vi.fn()
    const second = vi.fn()
    const stopFirst = $session.subscribe(first)
    const stopSecond = $session.subscribe(second)
    await signOut()
    expect(remoteSignOut).toHaveBeenCalledOnce()
    expect($signedIn.get()).toBe(false)
    expect(first).toHaveBeenLastCalledWith(null, { name: 'Ada' }, undefined)
    expect(second).toHaveBeenLastCalledWith(null, { name: 'Ada' }, undefined)
    stopFirst()
    stopSecond()
  })

  it('shares one socket and closes it after the last subscriber', async () => {
    vi.useFakeTimers()
    const sockets: FakeSocket[] = []
    class FakeSocket {
      onmessage: ((event: { data: string }) => void) | null = null
      close = vi.fn()
      constructor(public url: string) {
        sockets.push(this)
      }
    }
    vi.stubGlobal('WebSocket', FakeSocket)
    vi.stubGlobal('PRICES_URL', 'wss://example.test/prices')
    const first = vi.fn()
    const second = vi.fn()
    const stopFirst = $prices.listen(first)
    const stopSecond = $prices.listen(second)
    expect(sockets).toHaveLength(1)
    expect(sockets[0].url).toBe('wss://example.test/prices')
    sockets[0].onmessage?.({ data: '{"paper":12}' })
    expect(first).toHaveBeenLastCalledWith({ paper: 12 }, {}, undefined)
    expect(second).toHaveBeenLastCalledWith({ paper: 12 }, {}, undefined)
    stopFirst()
    expect(sockets[0].close).not.toHaveBeenCalled()
    stopSecond()
    await vi.advanceTimersByTimeAsync(1100)
    expect(sockets[0].close).toHaveBeenCalledOnce()
  })
  it('follows the media query and removes the listener after the last subscriber', async () => {
    vi.useFakeTimers()
    const query = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => query),
    )
    const stop = $isMobile.listen(() => {})
    expect($isMobile.get()).toBe(true)
    const update = query.addEventListener.mock.calls[0][1] as () => void
    query.matches = false
    update()
    expect($isMobile.get()).toBe(false)
    stop()
    await vi.advanceTimersByTimeAsync(1100)
    expect(query.removeEventListener).toHaveBeenCalledWith('change', update)
  })

  it('changes one nested field of the checkout form', () => {
    setCity('Berlin')
    expect($checkout.get()).toEqual({
      name: '',
      address: { city: 'Berlin', zip: '' },
    })
  })

  it('derives admins from users added in getting started', () => {
    $users.set([])
    addUser({ name: 'Ada', isAdmin: true })
    addUser({ name: 'Bob', isAdmin: false })
    expect($admins.get()).toEqual([{ name: 'Ada', isAdmin: true }])
  })
})
