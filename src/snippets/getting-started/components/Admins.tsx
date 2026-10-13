// #region show
import { useStore } from '@nanostores/react'
import { $admins } from '../stores/admins'

export function Admins() {
  const admins = useStore($admins)
  return (
    <ul>
      {admins.map((user) => (
        <li key={user.name}>{user.name}</li>
      ))}
    </ul>
  )
}
// #endregion
