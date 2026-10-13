import { useStore } from '@nanostores/react'
import { $cart } from './cart'

export function Header() {
  // #region show
  const cart = useStore($cart)
  return <span>Cart ({cart.length})</span>
  // #endregion
}
