// #region show
import { atom } from 'nanostores'

export interface User {
  name: string
  isAdmin: boolean
}

export const $users = atom<User[]>([])

export function addUser(user: User) {
  $users.set([...$users.get(), user])
}
// #endregion
