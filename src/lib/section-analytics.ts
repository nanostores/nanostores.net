type SectionRect = { id: string; top: number; bottom: number }
type Send = (
  event: 'section_view' | 'section_dwell',
  props: { situationId: string; ms?: number },
) => void

export const sectionViewDelay = 1000

// Use viewport coverage for tall sections and section coverage for short ones.
export function activeSection(sections: SectionRect[], viewport: number) {
  let best: { id: string; visible: number } | undefined
  for (const { id, top, bottom } of sections) {
    const height = bottom - top
    if (height <= 0 || viewport <= 0) continue
    const visible = Math.max(0, Math.min(bottom, viewport) - Math.max(top, 0))
    if (
      visible / Math.min(height, viewport) >= 0.5 &&
      (!best || visible > best.visible)
    )
      best = { id, visible }
  }
  return best?.id ?? null
}

// update(null) ends the visible interval on blur, navigation or suspension.
// The seen set survives pauses and BFCache restores, but no timer does.
export function createSectionTracker(
  send: Send,
  now: () => number = () => performance.now(),
) {
  const seen = new Set<string>()
  let current: string | null = null
  let enteredAt = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  function view(id: string) {
    if (seen.has(id)) return
    seen.add(id)
    send('section_view', { situationId: id })
  }
  return {
    update(next: string | null) {
      if (next === current) return
      clearTimeout(timer)
      const time = now()
      if (current) {
        const ms = Math.round(time - enteredAt)
        // A throttled timer may not have fired before the interval ended.
        if (ms >= sectionViewDelay) view(current)
        if (ms > 0 && seen.has(current)) {
          send('section_dwell', { situationId: current, ms })
        }
      }
      current = next
      enteredAt = time
      if (next && !seen.has(next)) {
        timer = setTimeout(() => view(next), sectionViewDelay)
      }
    },
  }
}
