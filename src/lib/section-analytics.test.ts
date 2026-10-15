import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { activeSection, createSectionTracker } from './section-analytics'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})
afterEach(() => {
  vi.useRealTimers()
})

it('uses the viewport for tall sections and the element for short sections', () => {
  expect(activeSection([{ id: 'tall', top: 400, bottom: 4400 }], 800)).toBe(
    'tall',
  )
  expect(activeSection([{ id: 'short', top: 700, bottom: 900 }], 800)).toBe(
    'short',
  )
  expect(
    activeSection([{ id: 'short', top: 701, bottom: 901 }], 800),
  ).toBeNull()
  expect(activeSection([{ id: 'empty', top: 0, bottom: 0 }], 800)).toBeNull()
})

it('selects the most visible qualifying section', () => {
  expect(
    activeSection(
      [
        { id: 'first', top: -300, bottom: 300 },
        { id: 'second', top: 300, bottom: 1000 },
      ],
      800,
    ),
  ).toBe('second')
})

it('does not count a fast scroll as a view or dwell', () => {
  const send = vi.fn()
  const tracker = createSectionTracker(send, () => Date.now())
  tracker.update('first')
  vi.advanceTimersByTime(999)
  tracker.update('second')
  vi.advanceTimersByTime(999)
  tracker.update(null)
  vi.runAllTimers()
  expect(send).not.toHaveBeenCalled()
})

it('counts one view across pauses, excludes hidden time and flushes once', () => {
  const send = vi.fn()
  const tracker = createSectionTracker(send, () => Date.now())
  tracker.update('first')
  vi.advanceTimersByTime(1200)
  tracker.update(null)
  tracker.update(null)
  vi.advanceTimersByTime(60_000)
  tracker.update('first')
  vi.advanceTimersByTime(300)
  tracker.update(null)
  expect(send.mock.calls).toEqual([
    ['section_view', { situationId: 'first' }],
    ['section_dwell', { situationId: 'first', ms: 1200 }],
    ['section_dwell', { situationId: 'first', ms: 300 }],
  ])
})

it('requires continuous visibility before the first view', () => {
  const send = vi.fn()
  const tracker = createSectionTracker(send, () => Date.now())
  tracker.update('first')
  vi.advanceTimersByTime(600)
  tracker.update(null)
  vi.advanceTimersByTime(5000)
  tracker.update('first')
  vi.advanceTimersByTime(999)
  expect(send).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(send).toHaveBeenCalledExactlyOnceWith('section_view', {
    situationId: 'first',
  })
})

it('handles delayed timers when ending a qualifying interval', () => {
  const send = vi.fn()
  const tracker = createSectionTracker(send, () => Date.now())
  tracker.update('first')
  vi.setSystemTime(2000)
  tracker.update(null)
  vi.runAllTimers()
  expect(send.mock.calls).toEqual([
    ['section_view', { situationId: 'first' }],
    ['section_dwell', { situationId: 'first', ms: 2000 }],
  ])
})
