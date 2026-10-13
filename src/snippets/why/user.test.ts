import { allTasks, cleanStores, keepMount } from 'nanostores'
import { afterEach, expect, it, vi } from 'vitest'
import { $isAdmin, $user } from './user'

vi.mock('./api', () => ({
  fetchUser: async () => ({ roles: ['admin'] }),
}))

// #region show
afterEach(() => {
  cleanStores($user, $isAdmin)
})

it('loads the user and derives admin status', async () => {
  keepMount($isAdmin)
  await allTasks()
  expect($isAdmin.get()).toBe(true)
})
// #endregion
