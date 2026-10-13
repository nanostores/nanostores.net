// #region show
import { computed } from 'nanostores'
import { $users } from './users'

export const $admins = computed($users, (users) =>
  users.filter((user) => user.isAdmin),
)
// #endregion
