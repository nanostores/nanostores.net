// #region show
import { $admins } from '../stores/admins'

const list = document.querySelector('#admins')!

$admins.subscribe((admins) => {
  list.replaceChildren(
    ...admins.map((user) => {
      const item = document.createElement('li')
      item.textContent = user.name
      return item
    }),
  )
})
// #endregion
