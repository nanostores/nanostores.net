import { $session } from './session'
// #region show
import { useStore } from '@nanostores/react'
export function Account() {
  const session = useStore($session)
  return <span>{session?.name ?? 'Guest'}</span>
}
// #endregion
