import { atom } from 'nanostores'
export type Product = { id: string; name: string }

// #region show
export const $cart = atom<Product[]>([])
export function addItem(product: Product) {
  $cart.set([...$cart.get(), product])
}
// #endregion
