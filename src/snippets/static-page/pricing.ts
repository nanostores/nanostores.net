import { atom } from 'nanostores'
type Period = 'monthly' | 'yearly'
declare const toggle: HTMLInputElement

// #region show
export const $period = atom<Period>('monthly')
$period.subscribe((period) => {
  for (const el of document.querySelectorAll<HTMLElement>('[data-price]')) {
    el.textContent = el.dataset[period] ?? ''
  }
})
toggle.addEventListener('change', () =>
  $period.set(toggle.checked ? 'yearly' : 'monthly'),
)
// #endregion
