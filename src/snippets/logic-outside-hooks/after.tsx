import {
  atom,
  computed,
  onMount,
} from 'nanostores'
import { useStore } from '@nanostores/react'

type User = { roles: string[] }

// #region show

const $user = atom<User | null>(null)

onMount($user, () => {
  fetchUser().then($user.set)
})
const $isAdmin = computed($user, (user) =>
  user?.roles.includes('admin'),
)
export function Header() {
  const isAdmin = useStore($isAdmin)
  return (
    <span>
      {isAdmin ? 'Admin' : 'User'}
    </span>
  )
}
// #endregion

export { $user, $isAdmin }
