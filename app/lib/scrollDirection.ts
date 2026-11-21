/**
 * Decides when the site header hides. Pure, so it can be unit-tested without a
 * DOM: feed it the current scroll position and it says whether the header
 * should be hidden. The component only wires scroll events to it.
 */

/** The header never hides before the page has scrolled this far (px). */
export const HIDE_AFTER = 80
/** Scroll distance (px) since the last decision before direction counts. Filters trackpad jitter. */
export const DELTA_THRESHOLD = 6
/** Beyond this offset (px) the header gets its solid / blurred background. */
export const SCROLLED_AFTER = 8

export type HeaderScrollState = {
  hidden: boolean
  /** Scroll position of the last decision. Small movements do not update it, so they add up. */
  lastY: number
}

export type HeaderScrollOptions = {
  hideAfter?: number
  threshold?: number
}

export const initialHeaderScroll = (y = 0): HeaderScrollState => ({ hidden: false, lastY: Math.max(0, y) })

/**
 * Next state for a new scroll position `y`.
 * - At or above `hideAfter` the header is always visible.
 * - Moves smaller than `threshold` (since the last decision) change nothing.
 * - Scrolling down hides it, scrolling up shows it.
 * Negative positions (iOS rubber-banding) are treated as 0.
 */
export function nextHeaderScroll(
  prev: HeaderScrollState,
  y: number,
  { hideAfter = HIDE_AFTER, threshold = DELTA_THRESHOLD }: HeaderScrollOptions = {},
): HeaderScrollState {
  const pos = Math.max(0, Number.isFinite(y) ? y : 0)
  if (pos <= hideAfter)
    return prev.hidden === false && prev.lastY === pos ? prev : { hidden: false, lastY: pos }
  const delta = pos - prev.lastY
  if (Math.abs(delta) < threshold) return prev
  return { hidden: delta > 0, lastY: pos }
}

/** Whether the header should show its background at scroll position `y`. */
export function isScrolled(y: number, after = SCROLLED_AFTER): boolean {
  return y > after
}
