import { computed } from 'nanostores'
import { createRouter } from '@nanostores/router'

// #region show
export const $router = createRouter({
  catalog: '/catalog',
  product: '/products/:id',
})

// /catalog?color=red → { color: 'red' }
export const $filters = computed($router, (page) => page?.search ?? {})
// #endregion
