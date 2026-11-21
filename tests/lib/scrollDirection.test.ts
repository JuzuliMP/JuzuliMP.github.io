import { describe, expect, it } from 'vitest'
import {
  DELTA_THRESHOLD,
  HIDE_AFTER,
  SCROLLED_AFTER,
  initialHeaderScroll,
  isScrolled,
  nextHeaderScroll,
  type HeaderScrollState,
} from '../../app/lib/scrollDirection'

/** Runs a list of scroll positions through the reducer and returns the hidden flag after each. */
function run(positions: number[], start: HeaderScrollState = initialHeaderScroll(0)) {
  let state = start
  return positions.map((y) => {
    state = nextHeaderScroll(state, y)
    return state.hidden
  })
}

describe('nextHeaderScroll', () => {
  it('stays visible at the top of the page', () => {
    expect(run([0, 10, 40, HIDE_AFTER])).toEqual([false, false, false, false])
  })

  it('hides when scrolling down past the first 80px', () => {
    expect(run([20, 70, 100, 160, 400])).toEqual([false, false, true, true, true])
  })

  it('does not hide on a downward move that stays inside the first 80px, however fast', () => {
    expect(nextHeaderScroll(initialHeaderScroll(0), HIDE_AFTER).hidden).toBe(false)
    expect(nextHeaderScroll(initialHeaderScroll(0), HIDE_AFTER + 1).hidden).toBe(true)
  })

  it('shows again on any scroll up beyond the jitter threshold', () => {
    expect(run([200, 400, 380])).toEqual([true, true, false])
    // A 4px wobble upward is jitter, not a direction change.
    expect(run([200, 400, 396])).toEqual([true, true, true])
  })

  it('ignores movements smaller than the threshold in either direction', () => {
    const hiddenAt300 = nextHeaderScroll(initialHeaderScroll(0), 300)
    expect(hiddenAt300.hidden).toBe(true)
    // Wobble of a few px: still hidden.
    expect(nextHeaderScroll(hiddenAt300, 300 - (DELTA_THRESHOLD - 1)).hidden).toBe(true)
    const shown = nextHeaderScroll(hiddenAt300, 250)
    expect(shown.hidden).toBe(false)
    // Wobble down by a few px: still shown.
    expect(nextHeaderScroll(shown, 250 + (DELTA_THRESHOLD - 1)).hidden).toBe(false)
  })

  it('adds up small steps: many tiny downward moves eventually count', () => {
    let state = nextHeaderScroll(initialHeaderScroll(0), 200)
    state = nextHeaderScroll(state, 150)
    expect(state.hidden).toBe(false)
    for (let y = 152; y <= 170; y += 2) state = nextHeaderScroll(state, y)
    // 150 -> 170 is 20px down in 2px steps; the reference point only moves at a decision.
    expect(state.hidden).toBe(true)
  })

  it('returns to visible when back at the top, even from a hidden state', () => {
    const state = nextHeaderScroll(initialHeaderScroll(0), 900)
    expect(state.hidden).toBe(true)
    expect(nextHeaderScroll(state, 60).hidden).toBe(false)
    expect(nextHeaderScroll(state, 0).hidden).toBe(false)
  })

  it('treats negative (rubber-band) positions as the top', () => {
    const state = nextHeaderScroll(initialHeaderScroll(500), -40)
    expect(state).toEqual({ hidden: false, lastY: 0 })
  })

  it('ignores NaN and returns a visible header', () => {
    expect(nextHeaderScroll(initialHeaderScroll(300), Number.NaN).hidden).toBe(false)
  })

  it('accepts custom thresholds', () => {
    const state = nextHeaderScroll(initialHeaderScroll(0), 150, { hideAfter: 200 })
    expect(state.hidden).toBe(false)
    expect(nextHeaderScroll(initialHeaderScroll(0), 250, { hideAfter: 200 }).hidden).toBe(true)
  })
})

describe('isScrolled', () => {
  it('turns on once the page has left the top', () => {
    expect(isScrolled(0)).toBe(false)
    expect(isScrolled(SCROLLED_AFTER)).toBe(false)
    expect(isScrolled(SCROLLED_AFTER + 1)).toBe(true)
  })
})
