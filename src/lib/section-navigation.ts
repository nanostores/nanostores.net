// Keep a section selected through its body, including long code examples.
// Update navigation only: scrolling never changes the URL or keyboard focus.
export function trackSectionLinks(
  links: HTMLAnchorElement[],
  onChange: (link: HTMLAnchorElement | undefined) => void,
  selectFirst = false,
): () => void {
  const entries = links
    .flatMap((link) => {
      const url = new URL(link.href)
      if (url.pathname !== location.pathname || !url.hash) return []
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      )
      return target ? [{ link, target }] : []
    })
    .sort((a, b) => {
      if (a.target === b.target) return 0
      return a.target.compareDocumentPosition(b.target) &
        Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1
    })
  let current: HTMLAnchorElement | undefined
  let initialized = false
  let frame = 0
  let stopped = false
  const update = () => {
    frame = 0
    // Match native fragment scrolling, including Starlight's scroll padding.
    // Allow for fractional heading positions after browser rounding.
    const offset =
      Math.max(
        (document.querySelector('header')?.getBoundingClientRect().height ??
          0) + 16,
        parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0,
      ) + 2
    let active = selectFirst ? entries[0] : undefined
    const atBottom =
      window.scrollY + innerHeight >= document.documentElement.scrollHeight - 1
    for (const entry of entries) {
      if (!entry.target.getClientRects().length) continue
      const top = entry.target.getBoundingClientRect().top
      if (top <= offset || (atBottom && top < innerHeight)) active = entry
    }
    if (initialized && active?.link === current) return
    initialized = true
    current = active?.link
    for (const entry of entries) {
      if (entry.link === current)
        entry.link.setAttribute('aria-current', 'location')
      else entry.link.removeAttribute('aria-current')
    }
    onChange(current)
  }
  const schedule = () => {
    if (!stopped && !frame) frame = requestAnimationFrame(update)
  }
  for (const event of ['scroll', 'resize', 'hashchange', 'load']) {
    window.addEventListener(event, schedule, { passive: true })
  }
  document.fonts.ready.then(schedule)
  update()
  return () => {
    stopped = true
    cancelAnimationFrame(frame)
    for (const event of ['scroll', 'resize', 'hashchange', 'load']) {
      window.removeEventListener(event, schedule)
    }
  }
}

// Reveal a selected entry by scrolling its navigation container only.
export function revealSectionLink(
  link: HTMLAnchorElement,
  scroller: HTMLElement,
): void {
  if (!scroller.getClientRects().length) return
  for (
    let group = link.closest('details');
    group && group !== scroller && scroller.contains(group);
    group = group.parentElement?.closest('details') ?? null
  ) {
    group.open = true
  }
  const item = link.getBoundingClientRect()
  const viewport = scroller.getBoundingClientRect()
  if (item.top < viewport.top) scroller.scrollTop += item.top - viewport.top
  else if (item.bottom > viewport.bottom)
    scroller.scrollTop += item.bottom - viewport.bottom
}
