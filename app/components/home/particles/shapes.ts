/**
 * Particle geometry for the Home scene. Pure, seeded and free of three.js so it
 * can be unit-tested and imported anywhere.
 *
 * The four shapes are ported from the Particles mockup (`Particles.dc.html`):
 * the same strokes (phone outline + screen bars, `</>`, globe rings + meridians)
 * and the same random "field" surface, but resampled to any point count by
 * walking the strokes instead of emitting a fixed ~500 dots.
 *
 * Coordinates are "half-size units": every shape fits (roughly) in a box from
 * -1 to 1 on x and y, y pointing up, centred on the origin, with a little z
 * depth so it reads as 3D. The scene multiplies by its pixel size. The field is
 * stretched across the viewport by the shader (see `layout.ts`).
 */

export const SHAPE_ORDER = ['field', 'phone', 'code', 'globe'] as const
export type ShapeName = (typeof SHAPE_ORDER)[number]

/** Share of the points that are faint ambient dust spread over the whole viewport. */
export const AMBIENT_SHARE = 0.09

/** Paper (#f2f0ea) and lime (#c6ff3d) as sRGB floats. Written straight into the shader, no colour-space conversion. */
export const PAPER_RGB = [242 / 255, 240 / 255, 234 / 255] as const
export const LIME_RGB = [198 / 255, 255 / 255, 61 / 255] as const

/** Fraction of the (non-dust) points drawn in lime. With dust left in paper this gives about 20% overall. */
const LIME_SHARE = 0.22
/** Fraction of the points drawn big (3px instead of 2px), as in the mockup. */
const BIG_SHARE = 0.2

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Number of ambient dust points (always the last ones) for a given total. */
export function ambientCount(count: number): number {
  return Math.min(count, Math.round(count * AMBIENT_SHARE))
}

/** Splits `total` into integer shares proportional to `weights` (largest remainder, sums exactly to `total`). */
export function allocate(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0 || total <= 0) return weights.map(() => 0)
  const exact = weights.map((w) => (w / sum) * total)
  const counts = exact.map(Math.floor)
  let left = total - counts.reduce((a, b) => a + b, 0)
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) counts[order[k]!.i]!++
  return counts
}

// ---------------------------------------------------------------------------
// Strokes. Mockup coordinates are a unit square with y pointing down.
// ---------------------------------------------------------------------------

type StrokePoint = {
  /** Unit-square x (0..1). */
  u: number
  /** Unit-square y (0..1, down). */
  v: number
  /** Opacity factor 0..1. */
  a: number
  /** Real depth in half-size units, added to the stroke's own z. */
  z?: number
}

type Stroke = {
  at: (t: number) => StrokePoint
  /** Approximate length in unit-square units; point share is proportional to length * passes. */
  length: number
  /** The mockup emits some strokes two or three times for density; here it also gives them depth layers. */
  passes: number
  /** Distance between pass layers (half-size units). */
  zStep: number
  zBase: number
  zJitter: number
  /** Extra density multiplier. */
  boost: number
}

type StrokeOptions = Partial<Pick<Stroke, 'passes' | 'zStep' | 'zBase' | 'zJitter' | 'boost'>> & { a?: number }

function makeStroke(at: Stroke['at'], length: number, o: StrokeOptions = {}): Stroke {
  return {
    at,
    length,
    passes: o.passes ?? 1,
    zStep: o.zStep ?? 0,
    zBase: o.zBase ?? 0,
    zJitter: o.zJitter ?? 0.03,
    boost: o.boost ?? 1,
  }
}

function seg(x1: number, y1: number, x2: number, y2: number, o: StrokeOptions = {}): Stroke {
  const a = o.a ?? 1
  return makeStroke(
    (t) => ({ u: x1 + (x2 - x1) * t, v: y1 + (y2 - y1) * t, a }),
    Math.hypot(x2 - x1, y2 - y1),
    o,
  )
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, o: StrokeOptions = {}): Stroke {
  const a = o.a ?? 1
  return makeStroke(
    (t) => {
      const ang = a0 + (a1 - a0) * t
      return { u: cx + r * Math.cos(ang), v: cy + r * Math.sin(ang), a }
    },
    Math.abs(a1 - a0) * r,
    o,
  )
}

function polylineLength(at: Stroke['at'], steps = 48): number {
  let len = 0
  let prev = at(0)
  for (let i = 1; i <= steps; i++) {
    const p = at(i / steps)
    len += Math.hypot(p.u - prev.u, p.v - prev.v)
    prev = p
  }
  return len
}

function phoneStrokes(): Stroke[] {
  const x0 = 0.3
  const x1 = 0.7
  const y0 = 0.08
  const y1 = 0.92
  const r = 0.07
  // Body outline: the mockup draws it twice. Here the two passes become the front and back faces of a thin slab.
  const body: StrokeOptions = { passes: 2, zStep: 0.09, zJitter: 0.025 }
  // Everything on the screen sits on the front face.
  const face: StrokeOptions = { zBase: 0.045, zJitter: 0.015 }
  const strokes: Stroke[] = [
    seg(x0 + r, y0, x1 - r, y0, body),
    seg(x0 + r, y1, x1 - r, y1, body),
    seg(x0, y0 + r, x0, y1 - r, body),
    seg(x1, y0 + r, x1, y1 - r, body),
    arc(x0 + r, y0 + r, r, Math.PI, 1.5 * Math.PI, body),
    arc(x1 - r, y0 + r, r, 1.5 * Math.PI, 2 * Math.PI, body),
    arc(x1 - r, y1 - r, r, 0, 0.5 * Math.PI, body),
    arc(x0 + r, y1 - r, r, 0.5 * Math.PI, Math.PI, body),
    seg(0.45, 0.13, 0.55, 0.13, face), // speaker
  ]
  // [y, length] of the content bars on the screen.
  const bars: ReadonlyArray<readonly [number, number]> = [
    [0.24, 0.26],
    [0.3, 0.16],
    [0.42, 0.26],
    [0.48, 0.2],
    [0.54, 0.12],
    [0.66, 0.26],
    [0.72, 0.18],
  ]
  for (const [y, len] of bars) strokes.push(seg(0.37, y, 0.37 + len, y, face))
  strokes.push(seg(0.42, 0.86, 0.58, 0.86, face)) // home bar
  return strokes
}

function codeStrokes(): Stroke[] {
  const o: StrokeOptions = { passes: 3, zStep: 0.07, zJitter: 0.03 }
  return [
    seg(0.32, 0.3, 0.12, 0.5, o),
    seg(0.12, 0.5, 0.32, 0.7, o),
    seg(0.6, 0.22, 0.4, 0.78, o),
    seg(0.68, 0.3, 0.88, 0.5, o),
    seg(0.88, 0.5, 0.68, 0.7, o),
  ]
}

function globeStrokes(): Stroke[] {
  const gx = 0.5
  const gy = 0.5
  const R = 0.4
  const strokes: Stroke[] = []
  // Latitude rings, squashed to 0.18 like the mockup. The back half is dimmer; depth is the real sphere depth.
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = (lat * Math.PI) / 180
    const rr = R * Math.cos(phi)
    const yy = gy - R * Math.sin(phi)
    strokes.push(
      makeStroke(
        (t) => {
          const th = t * 2 * Math.PI
          return {
            u: gx + rr * Math.cos(th),
            v: yy + rr * Math.sin(th) * 0.18,
            a: Math.sin(th) > 0 ? 1 : 0.3,
            z: rr * Math.sin(th) * 2,
          }
        },
        2 * Math.PI * rr,
      ),
    )
  }
  // Six meridians.
  for (let m = 0; m < 6; m++) {
    const lon = (m / 6) * Math.PI + 0.3
    const at: Stroke['at'] = (t) => {
      const p2 = -Math.PI / 2 + t * Math.PI
      const z = Math.cos(p2) * Math.sin(lon)
      return {
        u: gx + R * Math.cos(p2) * Math.cos(lon),
        v: gy - R * Math.sin(p2),
        a: z >= 0 ? 1 : 0.3,
        z: z * R * 2,
      }
    }
    strokes.push(makeStroke(at, polylineLength(at)))
  }
  // Outline of the sphere.
  strokes.push(arc(gx, gy, R, 0, 2 * Math.PI, { boost: 1.4 }))
  return strokes
}

const STROKES: Record<Exclude<ShapeName, 'field'>, () => Stroke[]> = {
  phone: phoneStrokes,
  code: codeStrokes,
  globe: globeStrokes,
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

type Raw = { x: number; y: number; z: number; a: number }

/** Unit-square (y down) to half-size units (y up). */
const hx = (u: number) => (u - 0.5) * 2
const hy = (v: number) => (0.5 - v) * 2

/** Jitter in half-size units; the mockup uses +-0.007 of the unit square. */
const JITTER = 0.028

function shapeSeed(name: ShapeName, seed: number): number {
  return (seed * 2654435761 + (SHAPE_ORDER.indexOf(name) + 1) * 40503) >>> 0
}

function fieldPoints(n: number, rnd: () => number): Raw[] {
  const out: Raw[] = []
  for (let i = 0; i < n; i++) {
    const fx = rnd()
    const crest = 0.42 + 0.12 * Math.sin(fx * 7.5 + 0.6) + 0.06 * Math.sin(fx * 19 + 2)
    const depth = Math.pow(rnd(), 1.7)
    const v = crest + depth * (1 - crest)
    out.push({
      x: (fx - 0.5) * 2,
      y: (0.65 - v) * 1.6,
      z: (rnd() - 0.5) * 1.2,
      a: (0.3 + 0.7 * (1 - depth)) * (0.5 + rnd() * 0.5),
    })
  }
  return out
}

function strokePoints(name: Exclude<ShapeName, 'field'>, n: number, rnd: () => number): Raw[] {
  const strokes = STROKES[name]()
  const counts = allocate(
    strokes.map((s) => s.length * s.passes * s.boost),
    n,
  )
  const out: Raw[] = []
  strokes.forEach((s, si) => {
    const m = counts[si]!
    for (let k = 0; k < m; k++) {
      const t = Math.min(1, Math.max(0, (k + 0.5 + (rnd() - 0.5) * 0.8) / m))
      const p = s.at(t)
      const pass = Math.min(s.passes - 1, Math.floor(rnd() * s.passes))
      out.push({
        x: hx(p.u) + (rnd() - 0.5) * JITTER,
        y: hy(p.v) + (rnd() - 0.5) * JITTER,
        z: (p.z ?? 0) + s.zBase + (pass - (s.passes - 1) / 2) * s.zStep + (rnd() - 0.5) * s.zJitter,
        a: p.a * (0.5 + rnd() * 0.5),
      })
    }
  })
  return out
}

function dustPoints(n: number, rnd: () => number): Raw[] {
  const out: Raw[] = []
  for (let i = 0; i < n; i++) {
    out.push({
      x: (rnd() - 0.5) * 2,
      y: (rnd() - 0.5) * 2,
      z: (rnd() - 0.5) * 1.2,
      a: 0.06 + rnd() * 0.16,
    })
  }
  return out
}

export type ShapeSample = {
  /** x, y, z per point; length `count * 3`. */
  positions: Float32Array
  /** Opacity 0..1 per point; length `count`. */
  opacity: Float32Array
}

/**
 * Builds one shape as exactly `count` points. The last `ambientCount(count)`
 * points are faint dust scattered over the whole box; the rest trace the shape,
 * sorted left to right so point i sits at a similar x in every shape (the morph
 * then moves points sideways in a coherent wave instead of crossing the screen).
 */
export function buildShape(name: ShapeName, count: number, seed = 1): ShapeSample {
  const n = Math.max(0, Math.floor(count))
  const rnd = mulberry32(shapeSeed(name, seed))
  const dust = ambientCount(n)
  const main = n - dust
  const body = name === 'field' ? fieldPoints(main, rnd) : strokePoints(name, main, rnd)
  body.sort((p, q) => p.x - q.x || p.y - q.y)
  const all = body.concat(dustPoints(dust, rnd))

  const positions = new Float32Array(n * 3)
  const opacity = new Float32Array(n)
  all.forEach((p, i) => {
    positions[i * 3] = p.x
    positions[i * 3 + 1] = p.y
    positions[i * 3 + 2] = p.z
    opacity[i] = p.a
  })
  return { positions, opacity }
}

/** Point positions (xyz, length `count * 3`) for one shape, centred on the origin. Same seed gives the same points. */
export function sampleShape(name: ShapeName, count: number, seed = 1): Float32Array {
  return buildShape(name, count, seed).positions
}

/** Per-point opacity for one shape, in the same order as `sampleShape`. */
export function sampleOpacity(name: ShapeName, count: number, seed = 1): Float32Array {
  return buildShape(name, count, seed).opacity
}

export type PointStyle = {
  /** rgb per point (sRGB floats), length `count * 3`. */
  colors: Float32Array
  /** Point size in CSS px (2 or 3). */
  sizes: Float32Array
  /** Random 0..1 per point, used for morph stagger and twinkle. */
  rand: Float32Array
  /** 1 for ambient dust points, else 0. */
  ambient: Float32Array
}

/** Colour, size and randomness per point. These belong to the particle, not to a shape, so they never change during a morph. */
export function sampleStyle(count: number, seed = 1): PointStyle {
  const n = Math.max(0, Math.floor(count))
  const rnd = mulberry32((seed * 2246822519 + 0x1234567) >>> 0)
  const dust = ambientCount(n)
  const colors = new Float32Array(n * 3)
  const sizes = new Float32Array(n)
  const rand = new Float32Array(n)
  const ambient = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const isDust = i >= n - dust
    const rgb = !isDust && rnd() < LIME_SHARE ? LIME_RGB : PAPER_RGB
    colors[i * 3] = rgb[0]
    colors[i * 3 + 1] = rgb[1]
    colors[i * 3 + 2] = rgb[2]
    sizes[i] = isDust ? 2 : rnd() < BIG_SHARE ? 3 : 2
    rand[i] = rnd()
    ambient[i] = isDust ? 1 : 0
  }
  return { colors, sizes, rand, ambient }
}
