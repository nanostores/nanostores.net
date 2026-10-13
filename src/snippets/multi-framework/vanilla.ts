import { $session, signOut } from './session'
// #region show
$session.subscribe((session) => {
  for (const el of document.querySelectorAll('[data-user-name]')) {
    el.textContent = session?.name ?? 'Guest'
  }
})
document.querySelector('#sign-out')?.addEventListener('click', signOut)
// #endregion
