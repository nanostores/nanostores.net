import { atom, map, onMount } from 'nanostores'

export const $activeSection = atom<string | null>(null)
export const $period = atom<'monthly' | 'yearly'>('monthly')
export const $copied = atom(false)
// Which sections show their folded code, by situation id.
export const $openCode = map<Record<string, boolean>>({})
export function setCodeOpen(situationId: string, open: boolean) {
  $openCode.setKey(situationId, open)
}
let copyTimer: ReturnType<typeof setTimeout> | undefined
onMount($copied, () => () => clearTimeout(copyTimer))
export function copiedInstall() {
  $copied.set(true)
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => $copied.set(false), 2000)
}
