import { atom } from 'nanostores'
import { useStore } from '@nanostores/react'
type Product = { id: string }
// #region show
export const $cart = atom<Product[]>([])
export const addItem = (item: Product) => $cart.set([...$cart.get(), item])
export function CartCount() {
  const cart = useStore($cart)
  return <span>{cart.length}</span>
}
// #endregion
