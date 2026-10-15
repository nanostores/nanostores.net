import { $activeSection, $openCode, setCodeOpen } from '../state/site'
import { track } from '../lib/analytics'
import { activeSection, createSectionTracker } from '../lib/section-analytics'

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
  if (situationId && open[situationId])
    track('content_expand', {
      situationId,
      contentType: situationId === 'small-ecosystem' ? 'objections' : 'code',
    })
})
const sectionTracker = createSectionTracker(track)
let suspended = false
let frame = 0
function active() {
  const id =
    document.hidden || suspended
      ? null
      : activeSection(
          sections.map((section) => {
            const { top, bottom } = section.getBoundingClientRect()
            return { id: section.dataset.situationId!, top, bottom }
          }),
          innerHeight,
        )
  $activeSection.set(id)
  sectionTracker.update(id)
}
function scheduleActive() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    active()
  })
}
// Four rects per animation frame keep the viewport rule exact at any height.
addEventListener('scroll', scheduleActive, { passive: true })
addEventListener('resize', scheduleActive)
document.addEventListener('visibilitychange', active)
addEventListener('pagehide', () => {
  suspended = true
  active()
})
addEventListener('pageshow', () => {
  suspended = false
  active()
})
active()
