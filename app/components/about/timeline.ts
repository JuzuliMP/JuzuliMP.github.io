/** Share of the viewport height a row's top edge must pass before its dot fills. */
export const DOT_THRESHOLD = 0.6

/**
 * Is this timeline dot "passed"? True once the row's top edge (distance from
 * the viewport top, as returned by `getBoundingClientRect().top`) has risen to
 * `threshold` of the viewport height or higher up. Scrolling back down makes
 * the top larger again, so the dot empties: the state is scroll-linked.
 */
export function isDotPassed(rowTop: number, viewportHeight: number, threshold: number = DOT_THRESHOLD): boolean {
  if (!Number.isFinite(rowTop) || !Number.isFinite(viewportHeight) || viewportHeight <= 0) return false
  return rowTop <= viewportHeight * threshold
}

/** `isDotPassed` for every row, in order. */
export function passedFlags(rowTops: readonly number[], viewportHeight: number, threshold: number = DOT_THRESHOLD): boolean[] {
  return rowTops.map((top) => isDotPassed(top, viewportHeight, threshold))
}

/** Shallow array equality, used to skip redundant state updates while scrolling. */
export function sameFlags(a: readonly boolean[], b: readonly boolean[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}
