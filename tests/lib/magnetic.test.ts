import { describe, expect, it } from 'vitest'
import { distanceToRect, magneticTarget } from '../../app/lib/magnetic'

const rect = { left: 100, top: 100, width: 120, height: 44 }

describe('distanceToRect', () => {
  it('is 0 inside and measures from the nearest edge outside', () => {
    expect(distanceToRect(rect, { x: 150, y: 120 })).toBe(0)
    expect(distanceToRect(rect, { x: 80, y: 120 })).toBe(20)
    expect(distanceToRect(rect, { x: 220 + 30, y: 144 + 40 })).toBe(50)
  })
})

describe('magneticTarget', () => {
  it('pulls toward the pointer within 80px of the element', () => {
    const t = magneticTarget(rect, { x: 160 + 60, y: 122 }, 80, 0.35)
    expect(t.x).toBeGreaterThan(0)
    expect(t.y).toBe(0)
  })

  it('rests when the pointer is further than the radius', () => {
    expect(magneticTarget(rect, { x: 220 + 81, y: 122 })).toEqual({ x: 0, y: 0 })
  })

  it('caps the shift', () => {
    const t = magneticTarget(rect, { x: 160 + 79 + 60, y: 122 }, 200, 1, 10)
    expect(Math.abs(t.x)).toBeLessThanOrEqual(10)
  })
})
