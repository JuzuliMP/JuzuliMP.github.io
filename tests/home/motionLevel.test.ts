import { describe, expect, it } from 'vitest'
import {
  LEVEL_FALL_S,
  LEVEL_RISE_S,
  MORPH_RATE_FULL,
  STIR_SPEED_FULL,
  STIR_SPEED_MIN,
  STIR_WEIGHT,
  combineMotion,
  followLevel,
  morphMotion,
  nearBox,
  stirMotion,
} from '../../app/components/home/particles/motionLevel'

describe('morphMotion', () => {
  it('is 0 at rest, 1 at a brisk scroll, and grows with scroll speed', () => {
    expect(morphMotion(0)).toBe(0)
    expect(morphMotion(MORPH_RATE_FULL)).toBe(1)
    expect(morphMotion(MORPH_RATE_FULL * 3)).toBe(1)
    expect(morphMotion(-MORPH_RATE_FULL)).toBe(1)
    const slow = morphMotion(0.3)
    const medium = morphMotion(1)
    expect(slow).toBeGreaterThan(0.1) // slow scrolling is still faintly audible
    expect(medium).toBeGreaterThan(slow)
    expect(morphMotion(Number.NaN)).toBe(0)
  })
})

describe('stirMotion', () => {
  it('is silent for slow hovering and away from the particles', () => {
    expect(stirMotion(STIR_SPEED_MIN, 1)).toBe(0)
    expect(stirMotion(1500, 0)).toBe(0)
  })

  it('grows with pointer speed, capped a little under a full morph', () => {
    expect(stirMotion(800, 1)).toBeGreaterThan(stirMotion(400, 1))
    expect(stirMotion(STIR_SPEED_FULL, 1)).toBeCloseTo(STIR_WEIGHT, 10)
    expect(stirMotion(STIR_SPEED_FULL * 4, 1)).toBeCloseTo(STIR_WEIGHT, 10)
    expect(stirMotion(1000, 0.5)).toBeCloseTo(stirMotion(1000, 1) * 0.5, 10)
  })
})

describe('combineMotion', () => {
  it('adds the two sources without going over 1', () => {
    expect(combineMotion(0, 0)).toBe(0)
    expect(combineMotion(0.5, 0)).toBe(0.5)
    expect(combineMotion(0.5, 0.5)).toBe(0.75)
    expect(combineMotion(1, 1)).toBe(1)
  })
})

describe('followLevel', () => {
  it('rises fast and falls slowly, like sand settling', () => {
    expect(LEVEL_RISE_S).toBeLessThan(LEVEL_FALL_S)
    const up = followLevel(0, 1, 0.1)
    const down = 1 - followLevel(1, 0, 0.1)
    expect(up).toBeGreaterThan(0.8)
    expect(down).toBeLessThan(0.3)
  })

  it('reaches exactly 0 once the motion has died away, and stays in 0..1', () => {
    let l = 1
    for (let i = 0; i < 200; i++) l = followLevel(l, 0, 1 / 60)
    expect(l).toBe(0)
    expect(followLevel(0.5, 2, 1)).toBeLessThanOrEqual(1)
    expect(followLevel(0.5, 1, 0)).toBe(0.5)
  })
})

describe('nearBox', () => {
  const box = { cx: 100, cy: 100, halfW: 50, halfH: 20 }
  it('is 1 inside, fades over the soft edge, 0 beyond', () => {
    expect(nearBox(120, 110, box, 100)).toBe(1)
    expect(nearBox(200, 100, box, 100)).toBeCloseTo(0.5, 10)
    expect(nearBox(400, 100, box, 100)).toBe(0)
    expect(nearBox(100, 500, box, 0)).toBe(0)
  })
})
