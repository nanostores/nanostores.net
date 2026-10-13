import { useStore } from '@nanostores/react'
import { $isAdmin } from './user'

// #region show
export function Header() {
  const isAdmin = useStore($isAdmin)
  return <span>{isAdmin ? 'Admin' : 'User'}</span>
}
// #endregion
