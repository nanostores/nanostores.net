import { atom, onMount } from 'nanostores'

// #region show
export const $isMobile = atom(false)

onMount($isMobile, () => {
  const query = matchMedia('(max-width: 767px)')
  const update = () => $isMobile.set(query.matches)
  update()
  query.addEventListener('change', update)
  return () => query.removeEventListener('change', update)
})
// #endregion
