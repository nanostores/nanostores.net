import { persistentJSON } from '@nanostores/persistent'
type Product = { id: string; name: string }

// #region show
export const $cart = persistentJSON<Product[]>('cart', [])
// #endregion
