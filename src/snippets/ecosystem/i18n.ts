import { browser, createI18n, localeFrom } from '@nanostores/i18n'

// #region show
export const $locale = localeFrom(browser({ available: ['en', 'de'] }))

export const i18n = createI18n($locale, {
  get: (code) => fetch(`/i18n/${code}.json`).then((r) => r.json()),
})

export const $cartMessages = i18n('cart', {
  title: 'Your cart',
})
// #endregion
