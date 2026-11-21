import { describe, expect, it } from 'vitest'
import {
  PREVIEW_SIZE,
  easePoint,
  easeToward,
  isSettled,
  placePreview,
} from '../../app/components/work/previewMotion'

const viewport = { width: 1440, height: 900 }

describe('placePreview', () => {
  it('sits to the right of the pointer, vertically centred on it', () => {
    const p = placePreview({ x: 400, y: 450 }, PREVIEW_SIZE, viewport)
    expect(p.x).toBe(428)
    expect(p.y).toBe(450 - PREVIEW_SIZE.height / 2)
  })

  it('flips to the left of the pointer when there is no room on the right', () => {
    const p = placePreview({ x: 1300, y: 450 }, PREVIEW_SIZE, viewport)
    expect(p.x).toBe(1300 - 28 - PREVIEW_SIZE.width)
    expect(p.x + PREVIEW_SIZE.width).toBeLessThanOrEqual(viewport.width - 16)
  })

  it('clamps inside the viewport at the top and bottom edges', () => {
    const top = placePreview({ x: 400, y: 0 }, PREVIEW_SIZE, viewport)
    expect(top.y).toBe(16)
    const bottom = placePreview({ x: 400, y: 900 }, PREVIEW_SIZE, viewport)
    expect(bottom.y).toBe(900 - PREVIEW_SIZE.height - 16)
  })

  it('clamps at the left edge after flipping on a narrow viewport', () => {
    const p = placePreview({ x: 100, y: 450 }, PREVIEW_SIZE, { width: 400, height: 900 })
    expect(p.x).toBeGreaterThanOrEqual(16)
  })

  it('pins to the margin when the viewport is smaller than the preview', () => {
    const p = placePreview({ x: 50, y: 50 }, PREVIEW_SIZE, { width: 200, height: 100 })
    expect(p).toEqual({ x: 16, y: 16 })
  })

  it('honours a custom offset and margin', () => {
    const p = placePreview({ x: 400, y: 450 }, { width: 100, height: 100 }, viewport, {
      offset: { x: 10, y: 20 },
      margin: 0,
    })
    expect(p).toEqual({ x: 410, y: 420 })
  })
})

describe('easeToward', () => {
  it('moves toward the target without overshooting', () => {
    let v = 0
    for (let i = 0; i < 60; i++) {
      const next = easeToward(v, 100, 1 / 60)
      expect(next).toBeGreaterThan(v)
      expect(next).toBeLessThanOrEqual(100)
      v = next
    }
    expect(v).toBeGreaterThan(90)
  })

  it('does not move when no time has passed, and ignores negative time', () => {
    expect(easeToward(10, 100, 0)).toBe(10)
    expect(easeToward(10, 100, -1)).toBe(10)
  })

  it('is frame-rate independent', () => {
    let a = 0
    for (let i = 0; i < 30; i++) a = easeToward(a, 100, 1 / 30)
    let b = 0
    for (let i = 0; i < 60; i++) b = easeToward(b, 100, 1 / 60)
    expect(a).toBeCloseTo(b, 5)
  })

  it('eases both axes of a point and reports when it has settled', () => {
    let p = { x: 0, y: 0 }
    const target = { x: 200, y: -100 }
    expect(isSettled(p, target)).toBe(false)
    for (let i = 0; i < 240; i++) p = easePoint(p, target, 1 / 60)
    expect(isSettled(p, target)).toBe(true)
  })
})
