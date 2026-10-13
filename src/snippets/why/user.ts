import { atom, computed, onMount, task } from 'nanostores'
import { fetchUser } from './api'

// #region show
export const $user = atom<{ roles: string[] } | null>(null)

onMount($user, () => {
  task(async () => {
    $user.set(await fetchUser())
  })
})

export const $isAdmin = computed($user, (user) => user?.roles.includes('admin'))
// #endregion
