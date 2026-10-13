import { deepMap } from '@nanostores/deepmap'

// #region show
export const $checkout = deepMap({
  name: '',
  address: { city: '', zip: '' },
})

export function setCity(city: string) {
  $checkout.setKey('address.city', city)
}
// #endregion
