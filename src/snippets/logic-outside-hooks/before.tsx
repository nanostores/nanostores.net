import {
  useEffect,
  useMemo,
  useState,
} from 'react'

type User = { roles: string[] }

// #region show
export function Header() {
  const [user, setUser] =
    useState<User | null>(null)
  useEffect(() => {
    fetchUser().then(setUser)
  }, [])
  const isAdmin = useMemo(
    () => user?.roles.includes('admin'),
    [user],
  )

  return (
    <span>
      {isAdmin ? 'Admin' : 'User'}
    </span>
  )
}
// #endregion
