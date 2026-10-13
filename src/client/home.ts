import { $activeSection, $openCode, setCodeOpen } from '../state/site'
import { track, type EventName } from '../lib/analytics'

const sections = [...document.querySelectorAll<HTMLElement>('.situation')]

// Code popovers: the store owns which section's code is open; the popover
// and its arrow render it. CSS anchors place both under the Show code
// button; without anchor positioning the popover gets --top from here.
const anchored = CSS.supports('anchor-name: --a')
const popovers = [
  ...document.querySelectorAll<HTMLElement>('[data-code-popover]'),
]
const arrowOf = (id: string) =>
  document.querySelector<HTMLElement>(`[data-code-arrow="${id}"]`)
popovers.forEach((popover) => {
  const id = popover.dataset.codePopover!
  popover.addEventListener('beforetoggle', (event) => {
    if (anchored || (event as ToggleEvent).newState !== 'open') return
    const button = document.querySelector(`[popovertarget="${popover.id}"]`)
    if (!button) return
    const top = button.getBoundingClientRect().bottom + scrollY + 8
    popover.style.setProperty('--top', `${top}px`)
  })
  popover.addEventListener('toggle', (event) =>
    setCodeOpen(id, (event as ToggleEvent).newState === 'open'),
  )
})
// Sync only the section that changed: toggle events arrive after the
// browser already switched popovers, so the others may be ahead of the store.
$openCode.listen((open, _old, id) => {
  const popover = popovers.find((item) => item.dataset.codePopover === id)
  if (!id || !popover) return
  const arrow = arrowOf(id)
  if (open[id]) {
    if (!popover.matches(':popover-open')) popover.showPopover()
    // Opened after the popover, so the top layer puts it above.
    if (arrow && !arrow.matches(':popover-open')) arrow.showPopover()
  } else {
    if (arrow?.matches(':popover-open')) arrow.hidePopover()
    if (popover.matches(':popover-open')) popover.hidePopover()
  }
})
$openCode.listen((open, _old, situationId) => {
  if (situationId && open[situationId]) track('code_expand', { situationId })
})
document.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-track]')
  if (!target) return
  track(target.dataset.track as EventName, {
    situationId: target.dataset.situationId,
    target: target.dataset.target,
  })
})

let enteredAt = performance.now()
const seen = new Set<string>()
function active() {
  let best: { id: string; visible: number } | undefined
  for (const section of sections) {
    const rect = section.getBoundingClientRect()
    const visible = Math.max(
      0,
      Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0),
    )
    // Sections can be shorter than half the screen: a section is active
    // when half of it is visible; the most visible one wins.
    const coverage = visible / Math.min(rect.height, innerHeight)
    if (coverage >= 0.5 && (!best || visible > best.visible))
      best = { id: section.dataset.situationId!, visible }
  }
  const previous = $activeSection.get()
  const id = best?.id || null
  if (id === previous) return
  const now = performance.now()
  if (previous)
    track('section_dwell', {
      situationId: previous,
      ms: Math.round(now - enteredAt),
    })
  $activeSection.set(id)
  enteredAt = now
  if (id && !seen.has(id)) {
    seen.add(id)
    track('section_view', { situationId: id })
  }
}
const observer = new IntersectionObserver(active, {
  threshold: [0, 0.25, 0.5, 0.75, 1],
})
sections.forEach((section) => observer.observe(section))
addEventListener('resize', active)
addEventListener('pagehide', () => {
  const id = $activeSection.get()
  if (id)
    track('section_dwell', {
      situationId: id,
      ms: Math.round(performance.now() - enteredAt),
    })
})
active()
