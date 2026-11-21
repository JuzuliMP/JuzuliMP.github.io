import { describe, expect, it } from 'vitest'
import {
  CENTRE_PLACE,
  SCATTER_DISTANCE,
  STIR_WIDTH,
  blendPlaces,
  cloudProgress,
  morphPlace,
  placeChanged,
  recede,
  stirPlace,
  type ShapeBox,
} from '../../app/components/home/particles/motionSpace'
import { sceneLayout } from '../../app/components/home/particles/layout'

const W = 1440
const H = 900

/** Shape boxes as the scene builds them from the layout (field, then chapters). */
const boxes = (width: number, height: number): ShapeBox[] => {
  const layout = sceneLayout(width, height, ['right', 'left', 'right'])
  const half = layout.sizePx / 2
  return layout.offsets.map((o, i) => ({
    cx: width / 2 + o.x,
    cy: height / 2 + o.y,
    halfW: i === 0 ? width / 2 : half,
    halfH: i === 0 ? 0.6 * half : half,
  }))
}

describe('cloudProgress', () => {
  it('starts at the first shape, ends at the next, and scatters only in between', () => {
    expect(cloudProgress(0)).toEqual({ k: 0, scatter: 0 })
    const end = cloudProgress(1)
    expect(end.k).toBeCloseTo(1, 10)
    expect(end.scatter).toBeCloseTo(0, 10)
    const mid = cloudProgress(0.5)
    expect(mid.k).toBeGreaterThan(0.3)
    expect(mid.k).toBeLessThan(0.7)
    expect(mid.scatter).toBeGreaterThan(0.6)
  })

  it('moves steadily forward', () => {
    let prev = -1
    for (let t = 0; t <= 1; t += 0.05) {
      const { k } = cloudProgress(t)
      expect(k).toBeGreaterThanOrEqual(prev)
      prev = k
    }
  })
})

describe('morphPlace (desktop: shapes alternate sides)', () => {
  const [field, ch1, ch2] = boxes(W, H)

  it('the hero field is centred, low and wide', () => {
    const p = morphPlace(field!, ch1!, 0, W, H)
    expect(p.pan).toBeCloseTo(0, 10)
    expect(p.height).toBeLessThan(-0.3)
    expect(p.width).toBeCloseTo(1, 10)
    expect(p.distance).toBe(0)
  })

  it('hero to chapter 1: slides from the centre to the right and rises', () => {
    const start = morphPlace(field!, ch1!, 0, W, H)
    const end = morphPlace(field!, ch1!, 1, W, H)
    expect(end.pan).toBeGreaterThan(0.3)
    expect(end.height).toBeGreaterThan(start.height)
    expect(end.width).toBeLessThan(start.width)
  })

  it('chapter 1 to 2: sweeps across from right to left', () => {
    const pans = [0, 0.25, 0.5, 0.75, 1].map((t) => morphPlace(ch1!, ch2!, t, W, H).pan)
    expect(pans[0]).toBeGreaterThan(0.3)
    expect(pans[4]).toBeLessThan(-0.3)
    for (let i = 1; i < pans.length; i++) expect(pans[i]!).toBeLessThan(pans[i - 1]!)
    expect(Math.abs(pans[2]!)).toBeLessThan(0.2)
  })

  it('scrolling back up retraces the same path', () => {
    for (const t of [0.2, 0.5, 0.8]) expect(morphPlace(ch1!, ch2!, t, W, H).pan).toBeCloseTo(morphPlace(ch1!, ch2!, t, W, H).pan, 12)
    // Going down at t is the same place as coming back up through t.
    expect(morphPlace(ch1!, ch2!, 0.3, W, H).pan).toBeGreaterThan(morphPlace(ch1!, ch2!, 0.7, W, H).pan)
  })

  it('mid-morph the scattered cloud is wider and further away', () => {
    const mid = morphPlace(ch1!, ch2!, 0.5, W, H)
    const rest = morphPlace(ch1!, ch2!, 1, W, H)
    expect(mid.width).toBeGreaterThan(rest.width)
    expect(mid.distance).toBeGreaterThan(0.2)
    expect(mid.distance).toBeLessThanOrEqual(SCATTER_DISTANCE)
    expect(rest.distance).toBeCloseTo(0, 10)
  })
})

describe('morphPlace (phones: every shape centred)', () => {
  it('stays in the middle; only height, width and distance change', () => {
    const [field, ch1, ch2] = boxes(390, 844)
    for (const t of [0, 0.5, 1]) {
      expect(morphPlace(field!, ch1!, t, 390, 844).pan).toBeCloseTo(0, 10)
      expect(morphPlace(ch1!, ch2!, t, 390, 844).pan).toBeCloseTo(0, 10)
    }
    expect(morphPlace(field!, ch1!, 1, 390, 844).height).toBeGreaterThan(morphPlace(field!, ch1!, 0, 390, 844).height)
  })
})

describe('stirPlace', () => {
  it('follows the pointer: left edge, centre, right edge, top and bottom', () => {
    expect(stirPlace(0, H / 2, 0, 0, W, H).pan).toBeCloseTo(-1, 10)
    const mid = stirPlace(W / 2, H / 2, 0, 0, W, H)
    expect(Math.abs(mid.pan)).toBe(0)
    expect(Math.abs(mid.height)).toBe(0)
    expect(mid.width).toBe(STIR_WIDTH)
    expect(mid.distance).toBe(0)
    expect(stirPlace(W, H / 2, 0, 0, W, H).pan).toBeCloseTo(1, 10)
    expect(stirPlace(W / 2, 0, 0, 0, W, H).height).toBeCloseTo(1, 10)
    expect(stirPlace(W / 2, H, 0, 0, W, H).height).toBeCloseTo(-1, 10)
  })

  it('is heard a little ahead in the direction of the swipe, and stays in range', () => {
    expect(stirPlace(W / 2, H / 2, 2000, 0, W, H).pan).toBeGreaterThan(0.2)
    expect(stirPlace(W / 2, H / 2, -2000, 0, W, H).pan).toBeLessThan(-0.2)
    expect(stirPlace(W, H / 2, 1e9, 0, W, H).pan).toBe(1)
    expect(stirPlace(Number.NaN, H / 2, 0, 0, W, H).pan).toBe(0)
  })
})

describe('blendPlaces, recede, placeChanged', () => {
  const left = { pan: -1, height: 0, width: 0.2, distance: 0 }
  const right = { pan: 1, height: 0.5, width: 1, distance: 0.4 }

  it('blends by how much each source moves', () => {
    expect(blendPlaces(left, 1, right, 0)).toEqual(left)
    expect(blendPlaces(left, 0, right, 1)).toEqual(right)
    expect(blendPlaces(left, 1, right, 1).pan).toBeCloseTo(0, 10)
    expect(blendPlaces(left, 1, right, 3).pan).toBeCloseTo(0.5, 10)
    expect(blendPlaces(left, 0, right, 0)).toEqual(left)
  })

  it('recedes as the particles fade out', () => {
    expect(recede(CENTRE_PLACE, 1).distance).toBe(0)
    expect(recede(CENTRE_PLACE, 0).distance).toBe(1)
    expect(recede({ ...CENTRE_PLACE, distance: 0.4 }, 0.5).distance).toBeCloseTo(0.7, 10)
  })

  it('ignores tiny changes', () => {
    expect(placeChanged(CENTRE_PLACE, { ...CENTRE_PLACE, pan: 0.005 })).toBe(false)
    expect(placeChanged(CENTRE_PLACE, { ...CENTRE_PLACE, pan: 0.05 })).toBe(true)
    expect(placeChanged(CENTRE_PLACE, { ...CENTRE_PLACE, distance: 0.05 })).toBe(true)
  })
})
