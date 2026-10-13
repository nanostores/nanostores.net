import { atom, onMount } from 'nanostores'
type Prices = Record<string, number>

// #region show
export const $prices = atom<Prices>({})
onMount($prices, () => {
  const ws = new WebSocket(PRICES_URL)
  ws.onmessage = (event) => $prices.set(JSON.parse(event.data) as Prices)
  return () => ws.close()
})
// #endregion
