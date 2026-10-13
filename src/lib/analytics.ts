import { order } from '../config/order'

export type EventName =
  | 'section_view'
  | 'section_dwell'
  | 'section_cta_click'
  | 'toc_click'
  | 'exit_click'
  | 'install_copy'
  | 'code_expand'
  | 'deep_view'
  | 'deep_cta_click'
  | 'package_click'
export type EventProps = {
  situationId?: string
  ms?: number
  target?: string
  from?: string
}
export type TrackedProps = Omit<EventProps, 'situationId'> & {
  situationId: string | null
  position: number | null
  page: string
}
export interface Adapter {
  send(event: EventName, props: TrackedProps): void
}
export const consoleAdapter: Adapter = {
  send: (event, props) => console.info('[Nano Stores]', event, props),
}
export const noopAdapter: Adapter = { send: () => {} }
let adapter: Adapter = import.meta.env.DEV ? consoleAdapter : noopAdapter
export function setAdapter(next: Adapter) {
  adapter = next
}
export function track(event: EventName, props: EventProps = {}) {
  const { situationId: inputId, ...details } = props
  const situationId = inputId ?? null
  const index = situationId ? order.indexOf(situationId) : -1
  const tracked = {
    ...details,
    situationId,
    position: index >= 0 ? index + 1 : null,
    page: location.pathname,
  }
  adapter.send(event, tracked)
}
