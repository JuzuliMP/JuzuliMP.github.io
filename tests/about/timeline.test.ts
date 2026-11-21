import { describe, expect, it } from 'vitest'
import { DOT_THRESHOLD, isDotPassed, passedFlags, sameFlags } from '../../app/components/about/timeline'

describe('isDotPassed', () => {
  it('uses 60% of the viewport height as the default line', () => {
    expect(DOT_THRESHOLD).toBe(0.6)
    expect(isDotPassed(540, 900)).toBe(true) // exactly on the line
    expect(isDotPassed(541, 900)).toBe(false) // just below it
  })

  it('is passed when the row is above the line, even above the viewport', () => {
    expect(isDotPassed(100, 900)).toBe(true)
    expect(isDotPassed(-400, 900)).toBe(true)
  })

  it('is not passed while the row is still low on the screen or below the fold', () => {
    expect(isDotPassed(850, 900)).toBe(false)
    expect(isDotPassed(2000, 900)).toBe(false)
  })

  it('empties again when scrolled back (row top grows)', () => {
    expect(isDotPassed(300, 900)).toBe(true)
    expect(isDotPassed(700, 900)).toBe(false)
  })

  it('honours a custom threshold', () => {
    expect(isDotPassed(400, 1000, 0.5)).toBe(true)
    expect(isDotPassed(600, 1000, 0.5)).toBe(false)
  })

  it('never reports passed for unusable input', () => {
    expect(isDotPassed(0, 0)).toBe(false)
    expect(isDotPassed(NaN, 900)).toBe(false)
    expect(isDotPassed(100, NaN)).toBe(false)
  })
})

describe('passedFlags / sameFlags', () => {
  it('fills rows in order as they pass the line', () => {
    expect(passedFlags([100, 600, 1100], 1000)).toEqual([true, true, false])
    expect(passedFlags([-900, -300, 200], 1000)).toEqual([true, true, true])
    expect(passedFlags([800, 1300, 1800], 1000)).toEqual([false, false, false])
    expect(passedFlags([Infinity], 1000)).toEqual([false])
  })

  it('compares flag lists', () => {
    expect(sameFlags([true, false], [true, false])).toBe(true)
    expect(sameFlags([true, false], [true, true])).toBe(false)
    expect(sameFlags([], [false])).toBe(false)
  })
})
