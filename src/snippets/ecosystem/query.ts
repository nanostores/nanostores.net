import { nanoquery } from '@nanostores/query'
type Product = { id: string; name: string }

// #region show
export const [createFetcherStore] = nanoquery({
  fetcher: (...keys) => fetch(keys.join('')).then((r) => r.json()),
})

export const $products = createFetcherStore<Product[]>(['/api/products'])
// #endregion
