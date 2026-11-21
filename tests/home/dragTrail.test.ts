import { describe, expect, it } from 'vitest'
import {
  HOVER_PUSH_PX,
  PUSH_MAX_PX,
  PUSH_PER_SPEED,
  TOUCH_GAIN,
  TRAIL_LENGTH,
  TRAIL_LIFE_MS,
  TRAIL_SAMPLE_MS,
  clearTrail,
  createTrail,
  createTrailUniforms,
  isTrailIdle,
  pushAmplitudePx,
  pushPointer,
  releasePointer,
  springEnvelope,
  writeTrailUniforms,
} from '../../app/components/home/particles/dragTrail'

const SPACE = { width: 1000, height: 800, worldPerPx: 0.01 }

/** Moves the pointer along a straight line, one event per `stepMs`. */
function sweep(trail: ReturnType<typeof createTrail>, from: [number, number], to: [number, number], t0: number, ms: number, stepMs = 8, gain = 1) {
  const steps = Math.max(1, Math.round(ms / stepMs))
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    pushPointer(trail, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, t0 + k * ms, gain)
  }
  return t0 + ms
}

describe('springEnvelope', () => {
  it('is 1 when the pointer is there and exactly 0 from the life time on', () => {
    expect(springEnvelope(0)).toBe(1)
    expect(springEnvelope(-20)).toBe(1)
    expect(springEnvelope(TRAIL_LIFE_MS)).toBe(0)
    expect(springEnvelope(TRAIL_LIFE_MS * 3)).toBe(0)
  })

  it('closes the parting with a small elastic overshoot, then settles (no smear, no long wobble)', () => {
    const samples: number[] = []
    for (let t = 0; t < TRAIL_LIFE_MS; t += 5) samples.push(springEnvelope(t))
    const min = Math.min(...samples)
    // It swings past rest once: a visible bounce, but under a third of the push.
    expect(min).toBeLessThan(-0.1)
    expect(min).toBeGreaterThan(-0.3)
    // It crosses zero only a couple of times (one bounce), not a long wobble.
    let crossings = 0
    for (let i = 1; i < samples.length; i++) if (Math.sign(samples[i]!) !== Math.sign(samples[i - 1]!)) crossings++
    expect(crossings).toBeLessThanOrEqual(3)
    // Mostly closed after a quarter second, settled well before the end.
    expect(springEnvelope(250)).toBeLessThan(0.25)
    expect(Math.abs(springEnvelope(TRAIL_LIFE_MS * 0.8))).toBeLessThan(0.04)
    // No jump when it is cut off at the life time.
    expect(Math.abs(springEnvelope(TRAIL_LIFE_MS - 1))).toBeLessThan(0.02)
  })
})

describe('pushAmplitudePx', () => {
  it('grows with the pointer speed and is capped', () => {
    expect(pushAmplitudePx(0, false)).toBe(0)
    expect(pushAmplitudePx(1000, false)).toBeCloseTo(1000 * PUSH_PER_SPEED, 5)
    expect(pushAmplitudePx(1e6, false)).toBe(PUSH_MAX_PX)
    expect(pushAmplitudePx(Number.NaN, false)).toBe(0)
    expect(pushAmplitudePx(-50, false)).toBe(0)
  })

  it('adds a small bubble around the pointer itself (the newest sample)', () => {
    expect(pushAmplitudePx(0, true)).toBe(HOVER_PUSH_PX)
    expect(pushAmplitudePx(1000, true)).toBeCloseTo(1000 * PUSH_PER_SPEED + HOVER_PUSH_PX, 5)
  })
})

describe('pushPointer', () => {
  it('starts idle and not tracking', () => {
    const t = createTrail()
    expect(t.length).toBe(TRAIL_LENGTH)
    expect(isTrailIdle(t, 0)).toBe(true)
  })

  it('the first position has no velocity: it only makes the hover bubble', () => {
    const t = createTrail()
    pushPointer(t, 500, 400, 100)
    expect(t.count).toBe(1)
    expect(t.vx[t.head]).toBe(0)
    expect(t.vy[t.head]).toBe(0)
    expect(isTrailIdle(t, 100)).toBe(false)
  })

  it('estimates the velocity in px per second', () => {
    const t = createTrail()
    // 1000 px/s to the right for 400 ms.
    sweep(t, [100, 300], [500, 300], 0, 400)
    expect(t.vx[t.head]).toBeGreaterThan(900)
    expect(t.vx[t.head]).toBeLessThan(1050)
    expect(Math.abs(t.vy[t.head]!)).toBeLessThan(1)
  })

  it('keeps one sample per TRAIL_SAMPLE_MS: the head follows the pointer, older samples stay behind', () => {
    const t = createTrail()
    sweep(t, [0, 0], [400, 0], 0, 400, 4)
    const expected = Math.floor(400 / TRAIL_SAMPLE_MS) + 1
    expect(t.count).toBe(expected)
    // The head is the most recent position; the previous sample is further back.
    const prev = (t.head - 1 + t.length) % t.length
    expect(t.x[t.head]).toBeCloseTo(400, 5)
    expect(t.x[prev]!).toBeLessThan(t.x[t.head]! - 10)
  })

  it('is a ring buffer: never grows past its length and overwrites the oldest', () => {
    const t = createTrail()
    sweep(t, [0, 0], [3000, 0], 0, 3000, 8)
    expect(t.count).toBe(TRAIL_LENGTH)
    const xs = Array.from(t.x)
    // Only recent positions are left.
    expect(Math.min(...xs)).toBeGreaterThan(3000 * (1 - (TRAIL_LENGTH + 1) * TRAIL_SAMPLE_MS / 3000) - 1)
  })

  it('ignores non-finite input', () => {
    const t = createTrail()
    pushPointer(t, Number.NaN, 10, 0)
    pushPointer(t, 10, Number.POSITIVE_INFINITY, 0)
    pushPointer(t, 10, 10, Number.NaN)
    expect(t.count).toBe(0)
  })
})

describe('idle detection', () => {
  it('goes idle once the newest sample has faded out', () => {
    const t = createTrail()
    const end = sweep(t, [100, 100], [300, 100], 0, 200)
    expect(isTrailIdle(t, end)).toBe(false)
    expect(isTrailIdle(t, end + TRAIL_LIFE_MS - 1)).toBe(false)
    expect(isTrailIdle(t, end + TRAIL_LIFE_MS)).toBe(true)
  })

  it('writeTrailUniforms reports no active samples once idle', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    const end = sweep(t, [100, 100], [300, 100], 0, 200)
    expect(writeTrailUniforms(t, end, SPACE, out)).toBeGreaterThan(0)
    expect(writeTrailUniforms(t, end + TRAIL_LIFE_MS + 5, SPACE, out)).toBe(0)
    expect(Array.from(out.strength).every((s) => s === 0)).toBe(true)
    expect(Array.from(out.data).every((v) => v === 0)).toBe(true)
  })
})

describe('clearTrail / releasePointer', () => {
  it('clear forgets every sample (window blur, tab hidden)', () => {
    const t = createTrail()
    const end = sweep(t, [100, 100], [500, 100], 0, 300)
    clearTrail(t)
    expect(t.count).toBe(0)
    expect(isTrailIdle(t, end)).toBe(true)
    const out = createTrailUniforms()
    expect(writeTrailUniforms(t, end, SPACE, out)).toBe(0)
  })

  it('release keeps the wake but the next move starts from rest, with no velocity spike', () => {
    const t = createTrail()
    const end = sweep(t, [100, 100], [300, 100], 0, 200)
    releasePointer(t)
    expect(t.count).toBeGreaterThan(0)
    // The pointer comes back far away, much later.
    pushPointer(t, 900, 700, end + 2000)
    expect(t.vx[t.head]).toBe(0)
    expect(t.vy[t.head]).toBe(0)
  })
})

describe('writeTrailUniforms', () => {
  it('maps CSS px to world units with y flipped and records the unit direction of travel (not a drag vector)', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    // Down and to the right at about 500 px/s each way.
    const end = sweep(t, [500, 400], [600, 500], 0, 200)
    expect(writeTrailUniforms(t, end, SPACE, out)).toBeGreaterThan(0)
    const i = t.head
    // Position: (600 - 500) * 0.01 = 1 right, (500 - 400) = 100px below centre = -1.
    expect(out.data[i * 4]).toBeCloseTo(1, 5)
    expect(out.data[i * 4 + 1]).toBeCloseTo(-1, 5)
    // Moving right and down on screen = +x, -y in world, as a unit vector.
    expect(out.data[i * 4 + 2]!).toBeCloseTo(Math.SQRT1_2, 2)
    expect(out.data[i * 4 + 3]!).toBeCloseTo(-Math.SQRT1_2, 2)
    expect(Math.hypot(out.data[i * 4 + 2]!, out.data[i * 4 + 3]!)).toBeCloseTo(1, 5)
  })

  it('pushes harder the faster the pointer moves, in world units', () => {
    const slow = createTrail()
    const fast = createTrail()
    const outSlow = createTrailUniforms()
    const outFast = createTrailUniforms()
    const e1 = sweep(slow, [100, 400], [200, 400], 0, 400) // 250 px/s
    const e2 = sweep(fast, [100, 400], [300, 400], 0, 200) // 1000 px/s
    writeTrailUniforms(slow, e1, SPACE, outSlow)
    writeTrailUniforms(fast, e2, SPACE, outFast)
    const kSlow = outSlow.strength[slow.head]! / SPACE.worldPerPx
    const kFast = outFast.strength[fast.head]! / SPACE.worldPerPx
    expect(kFast).toBeGreaterThan(kSlow * 2)
    // About speed * PUSH_PER_SPEED plus the hover bubble.
    expect(kFast).toBeCloseTo(1000 * PUSH_PER_SPEED + HOVER_PUSH_PX, -1)
  })

  it('caps a single sample however fast the pointer flies', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    const end = sweep(t, [0, 400], [9000, 400], 0, 100, 4) // 90 000 px/s
    writeTrailUniforms(t, end, SPACE, out)
    for (let i = 0; i < t.length; i++) {
      expect(Math.abs(out.strength[i]!) / SPACE.worldPerPx).toBeLessThanOrEqual(PUSH_MAX_PX + HOVER_PUSH_PX + 1e-3)
    }
  })

  it('follows the spring with age: parted, briefly pulled back past rest, then nothing', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    const end = sweep(t, [100, 400], [400, 400], 0, 300)
    writeTrailUniforms(t, end, SPACE, out)
    const fresh = out.strength[t.head]!
    expect(fresh).toBeGreaterThan(0)
    // Find the overshoot: negative somewhere in the first half second.
    let min = Infinity
    for (let ms = 0; ms <= 500; ms += 10) {
      writeTrailUniforms(t, end + ms, SPACE, out)
      min = Math.min(min, out.strength[t.head]!)
    }
    expect(min).toBeLessThan(0)
    expect(min).toBeGreaterThan(-fresh * 0.3)
    writeTrailUniforms(t, end + TRAIL_LIFE_MS, SPACE, out)
    expect(out.strength[t.head]).toBe(0)
    expect(out.data[t.head * 4]).toBe(0)
  })

  it('a still pointer keeps only the hover bubble, with no direction', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    pushPointer(t, 500, 400, 0)
    writeTrailUniforms(t, 0, SPACE, out)
    const i = t.head
    expect(out.strength[i]! / SPACE.worldPerPx).toBeCloseTo(HOVER_PUSH_PX, 5)
    expect(out.data[i * 4 + 2]).toBe(0)
    expect(out.data[i * 4 + 3]).toBe(0)
  })

  it('older samples get no hover bubble: only the pointer itself makes room when slow', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    // 10 px/s for a second: barely moving, so speed pushes are ~0.
    const end = sweep(t, [500, 400], [510, 400], 0, 1000, 16)
    writeTrailUniforms(t, end, SPACE, out)
    const prev = (t.head - 1 + t.length) % t.length
    expect(Math.abs(out.strength[prev]!) / SPACE.worldPerPx).toBeLessThan(2)
    expect(out.strength[t.head]! / SPACE.worldPerPx).toBeGreaterThan(HOVER_PUSH_PX * 0.9)
  })

  it('fingers stir more gently than the mouse', () => {
    const mouse = createTrail()
    const finger = createTrail()
    const a = createTrailUniforms()
    const b = createTrailUniforms()
    const e1 = sweep(mouse, [100, 400], [300, 400], 0, 200)
    const e2 = sweep(finger, [100, 400], [300, 400], 0, 200, 8, TOUCH_GAIN)
    writeTrailUniforms(mouse, e1, SPACE, a)
    writeTrailUniforms(finger, e2, SPACE, b)
    expect(b.strength[finger.head]!).toBeCloseTo(a.strength[mouse.head]! * TOUCH_GAIN, 5)
  })

  it('writes into the arrays it is given without allocating new ones', () => {
    const t = createTrail()
    const out = createTrailUniforms()
    const data = out.data
    const strength = out.strength
    const end = sweep(t, [0, 0], [100, 0], 0, 100)
    writeTrailUniforms(t, end, SPACE, out)
    expect(out.data).toBe(data)
    expect(out.strength).toBe(strength)
    expect(data.length).toBe(TRAIL_LENGTH * 4)
    expect(strength.length).toBe(TRAIL_LENGTH)
  })
})
