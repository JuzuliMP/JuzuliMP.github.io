import { describe, expect, it } from 'vitest'
import {
  AMBIENT_SHARE,
  SHAPE_ORDER,
  allocate,
  ambientCount,
  sampleOpacity,
  sampleShape,
  sampleStyle,
  type ShapeName,
} from '../../app/components/home/particles/shapes'

const COUNTS = [1, 7, 120, 1800, 4000]

describe('allocate', () => {
  it('splits a total proportionally and always sums exactly', () => {
    expect(allocate([1, 1, 2], 8)).toEqual([2, 2, 4])
    for (const total of [0, 1, 5, 97, 1000]) {
      const parts = allocate([0.3, 5.2, 1.1, 2.9, 0.01], total)
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total)
      expect(parts.every((n) => Number.isInteger(n) && n >= 0)).toBe(true)
    }
  })

  it('returns zeros for empty weights or a zero total', () => {
    expect(allocate([], 10)).toEqual([])
    expect(allocate([1, 2], 0)).toEqual([0, 0])
    expect(allocate([0, 0], 5)).toEqual([0, 0])
  })
})

describe('sampleShape', () => {
  it.each(SHAPE_ORDER)('%s returns exactly count * 3 finite numbers', (name) => {
    for (const count of COUNTS) {
      const pts = sampleShape(name, count, 3)
      expect(pts).toBeInstanceOf(Float32Array)
      expect(pts.length).toBe(count * 3)
      expect(Array.from(pts).every(Number.isFinite)).toBe(true)
    }
  })

  it.each(SHAPE_ORDER)('%s is deterministic for the same seed and varies with the seed', (name) => {
    const a = sampleShape(name, 500, 11)
    const b = sampleShape(name, 500, 11)
    const c = sampleShape(name, 500, 12)
    expect(Array.from(a)).toEqual(Array.from(b))
    expect(Array.from(a)).not.toEqual(Array.from(c))
  })

  it.each(SHAPE_ORDER)('%s stays centred on the origin and inside the expected bounds', (name) => {
    const pts = sampleShape(name, 4000, 5)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let sumX = 0
    let sumY = 0
    let maxZ = 0
    for (let i = 0; i < pts.length; i += 3) {
      const [x, y, z] = [pts[i]!, pts[i + 1]!, pts[i + 2]!]
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      sumX += x
      sumY += y
      maxZ = Math.max(maxZ, Math.abs(z))
    }
    expect(minX).toBeGreaterThanOrEqual(-1.1)
    expect(maxX).toBeLessThanOrEqual(1.1)
    expect(minY).toBeGreaterThanOrEqual(-1.1)
    expect(maxY).toBeLessThanOrEqual(1.1)
    expect(maxZ).toBeLessThanOrEqual(1.1)
    // Centred (the field is a surface hanging below a crest, so allow a wider tolerance on y).
    expect(Math.abs(sumX / 4000)).toBeLessThan(0.1)
    expect(Math.abs(sumY / 4000)).toBeLessThan(0.3)
  })

  it('gives every shape some depth so it reads as 3D', () => {
    for (const name of SHAPE_ORDER) {
      const pts = sampleShape(name, 2000, 2)
      const zs = Array.from({ length: 2000 }, (_, i) => pts[i * 3 + 2]!)
      expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(0.05)
    }
  })

  it('draws recognisable outlines: phone is tall and narrow, code is wide, the globe is round', () => {
    const extent = (name: ShapeName) => {
      // Ignore the ambient dust (the last points).
      const n = 4000 - ambientCount(4000)
      const pts = sampleShape(name, 4000, 1)
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
      for (let i = 0; i < n; i++) {
        x0 = Math.min(x0, pts[i * 3]!)
        x1 = Math.max(x1, pts[i * 3]!)
        y0 = Math.min(y0, pts[i * 3 + 1]!)
        y1 = Math.max(y1, pts[i * 3 + 1]!)
      }
      return { w: x1 - x0, h: y1 - y0 }
    }
    const phone = extent('phone')
    const code = extent('code')
    const globe = extent('globe')
    expect(phone.h).toBeGreaterThan(phone.w * 1.8)
    expect(code.w).toBeGreaterThan(code.h * 1.2)
    expect(globe.w / globe.h).toBeGreaterThan(0.9)
    expect(globe.w / globe.h).toBeLessThan(1.1)
    expect(extent('field').w).toBeGreaterThan(1.8)
  })

  it('makes the four shapes different from each other', () => {
    const shapes = SHAPE_ORDER.map((n) => sampleShape(n, 800, 1))
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        let moved = 0
        for (let k = 0; k < 800; k++) {
          const d = Math.hypot(
            shapes[i]![k * 3]! - shapes[j]![k * 3]!,
            shapes[i]![k * 3 + 1]! - shapes[j]![k * 3 + 1]!,
          )
          if (d > 0.05) moved++
        }
        expect(moved, `${SHAPE_ORDER[i]} vs ${SHAPE_ORDER[j]}`).toBeGreaterThan(400)
      }
    }
  })

  it('ends with ambient dust, the share the constants say', () => {
    expect(ambientCount(4000)).toBe(Math.round(4000 * AMBIENT_SHARE))
    expect(ambientCount(3)).toBeLessThanOrEqual(3)
    const pts = sampleShape('phone', 1000, 1)
    const dust = ambientCount(1000)
    // Dust is spread over the whole box, so its x range is wide.
    const xs = Array.from({ length: dust }, (_, i) => pts[(1000 - dust + i) * 3]!)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(1.5)
  })

  it('handles empty and fractional counts', () => {
    expect(sampleShape('globe', 0).length).toBe(0)
    expect(sampleShape('globe', 10.9).length).toBe(30)
  })
})

describe('sampleOpacity and sampleStyle', () => {
  it.each(SHAPE_ORDER)('%s opacity has one value in (0, 1] per point', (name) => {
    const o = sampleOpacity(name, 1000, 4)
    expect(o.length).toBe(1000)
    for (const v of o) {
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('dims the back of the globe', () => {
    const o = sampleOpacity('globe', 2000, 4)
    const bright = Array.from(o).filter((v) => v > 0.5).length
    expect(bright).toBeGreaterThan(500)
    expect(bright).toBeLessThan(2000)
  })

  it('colours about 20% of the points lime, the rest paper, and is deterministic', () => {
    const a = sampleStyle(4000, 9)
    const b = sampleStyle(4000, 9)
    expect(Array.from(a.colors)).toEqual(Array.from(b.colors))
    let lime = 0
    for (let i = 0; i < 4000; i++) if (a.colors[i * 3]! < 0.9) lime++ // lime red channel is 0.78, paper 0.95
    expect(lime / 4000).toBeGreaterThan(0.15)
    expect(lime / 4000).toBeLessThan(0.25)
    expect(a.colors.length).toBe(12000)
    expect(a.sizes.length).toBe(4000)
    expect(new Set(a.sizes)).toEqual(new Set([2, 3]))
    expect(Array.from(a.rand).every((v) => v >= 0 && v < 1)).toBe(true)
    expect(a.ambient.reduce((s, v) => s + v, 0)).toBe(ambientCount(4000))
    expect(a.ambient[3999]).toBe(1)
    expect(a.ambient[0]).toBe(0)
  })
})
