/**
 * "Drifting sand": the sound of the particles moving, like sand blown off a
 * dune crest. Synthesised, no audio file. Two layers:
 *
 *   - hiss: soft wind noise through a high-pass filter, with a slow gust
 *     (an LFO on its level) so it breathes instead of sitting still;
 *   - ticks: sparse grains skittering across the surface (a looped buffer of
 *     tiny noise clicks).
 *
 * The particle scene reports how much the particles are moving as a level
 * from 0 to 1 (see `motionLevel.ts` in the particle folder). The level drives
 * loudness (silent at rest), how fast the grains tick (playback speed) and how
 * bright the hiss is. `SAND_VOLUME` scales the whole voice.
 *
 * Both layers are stereo: each side plays its own (differently seeded) noise
 * and grains, so the sand has width that `sandSpace.ts` can narrow, widen and
 * move around the listener. Each side is as loud as the earlier mono version.
 *
 * `fillGrains`, `fillHiss` and `sandParams` are pure so they can be unit-tested.
 */
import { createRng } from './ambientScore'

/**
 * Overall volume of the sand, as a fraction of the "Drifting sand" preview's
 * level. The one knob for how loud it is: 0.15 is the owner's choice, a quiet
 * texture well under the background score.
 */
export const SAND_VOLUME = 0.15
/** Length of the looped buffers (seconds): long enough that the loop is not heard. */
export const SAND_BUFFER_SECONDS = 2.5
/** Skittering grains per second at normal playback speed. */
export const GRAINS_PER_SECOND = 260
/** Tick playback speed at rest and at full motion. */
export const SAND_RATE_MIN = 0.7
export const SAND_RATE_MAX = 1.6
/** Hiss high-pass cut-off at rest and at full motion (Hz): faster motion, brighter hiss. */
export const HISS_FREQ_MIN = 2000
export const HISS_FREQ_MAX = 4500
/** Layer levels at full motion, before SAND_VOLUME. */
export const HISS_GAIN = 0.18
export const GUST_DEPTH = 0.08
export const TICK_GAIN = 0.7
/** Gust speed (Hz). */
export const GUST_HZ = 0.6
/** Below this level the sand is fully silent. */
export const SAND_SILENT_BELOW = 0.004
/** How quickly the sound follows the level (seconds, time constants). */
const HISS_TAU = 0.2
const TICK_TAU = 0.1

const GRAIN_SEED = 7
const HISS_SEED = 3
/** Seeds of the right-hand side, so the two sides are uncorrelated. */
const GRAIN_SEED_RIGHT = 8
const HISS_SEED_RIGHT = 4

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

/**
 * Fills `data` with sparse looping grains (in place): short decaying noise
 * clicks of random size, mostly small. Grains that run past the end wrap to
 * the start, so the loop has no seam. The result peaks at 0.9.
 */
export function fillGrains(data: Float32Array, sampleRate: number, seed = GRAIN_SEED): Float32Array {
  const n = data.length
  if (n === 0) return data
  const rnd = createRng(seed)
  data.fill(0)
  const grains = Math.round((n / sampleRate) * GRAINS_PER_SECOND)
  for (let g = 0; g < grains; g++) {
    const start = Math.floor(rnd() * n)
    const amp = (0.12 + 0.88 * rnd() ** 3) * (rnd() < 0.5 ? -1 : 1)
    const len = Math.max(2, Math.round(sampleRate * (0.0004 + 0.0011 * rnd())))
    for (let j = 0; j < len; j++) {
      const idx = (start + j) % n
      data[idx] = data[idx]! + (rnd() * 2 - 1) * amp * Math.exp((-6 * j) / len)
    }
  }
  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]!))
  if (peak > 0) for (let i = 0; i < n; i++) data[i] = (data[i]! / peak) * 0.9
  return data
}

/** Fills `data` with soft (slightly low-passed) noise for the wind hiss. Stays within -1..1. */
export function fillHiss(data: Float32Array, seed = HISS_SEED): Float32Array {
  const rnd = createRng(seed)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    last = last * 0.6 + (rnd() * 2 - 1) * 0.4
    data[i] = last
  }
  return data
}

export type SandParams = {
  /** Hiss level, its gust depth and the tick level (SAND_VOLUME applied). */
  hiss: number
  gust: number
  ticks: number
  /** Tick playback speed. */
  rate: number
  /** Hiss high-pass cut-off (Hz). */
  freq: number
}

/** Sound settings for a motion level (0..1). */
export function sandParams(level: number): SandParams {
  const l = clamp01(level)
  const v = l < SAND_SILENT_BELOW ? 0 : l
  return {
    hiss: SAND_VOLUME * HISS_GAIN * v ** 1.1,
    gust: SAND_VOLUME * GUST_DEPTH * v,
    ticks: SAND_VOLUME * TICK_GAIN * v ** 1.2,
    rate: SAND_RATE_MIN + (SAND_RATE_MAX - SAND_RATE_MIN) * l,
    freq: HISS_FREQ_MIN + (HISS_FREQ_MAX - HISS_FREQ_MIN) * l,
  }
}

export type Sand = {
  /** Sets the motion level (0..1). Changes glide, so per-frame updates never click. */
  setLevel: (level: number) => void
  level: () => number
  dispose: () => void
}

/** Builds the drifting-sand voice into `out` (the space stage, or the master). It starts silent. */
export function createSand(ctx: AudioContext, out: AudioNode): Sand {
  const length = Math.max(1, Math.round(ctx.sampleRate * SAND_BUFFER_SECONDS))
  const loop = (fill: (d: Float32Array, side: 0 | 1) => void) => {
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    fill(buffer.getChannelData(0), 0)
    fill(buffer.getChannelData(1), 1)
    const s = ctx.createBufferSource()
    s.buffer = buffer
    s.loop = true
    return s
  }
  const rest = sandParams(0)

  // Hiss: noise -> high-pass -> level (the gust LFO wobbles the level).
  const hissSrc = loop((d, side) => fillHiss(d, side ? HISS_SEED_RIGHT : HISS_SEED))
  const hissFilter = ctx.createBiquadFilter()
  hissFilter.type = 'highpass'
  hissFilter.frequency.value = rest.freq
  hissFilter.Q.value = 0.7
  const hissGain = ctx.createGain()
  hissGain.gain.value = 0
  const gust = ctx.createOscillator()
  gust.frequency.value = GUST_HZ
  const gustDepth = ctx.createGain()
  gustDepth.gain.value = 0
  hissSrc.connect(hissFilter)
  hissFilter.connect(hissGain)
  hissGain.connect(out)
  gust.connect(gustDepth)
  gustDepth.connect(hissGain.gain)

  // Ticks: grains -> high-pass -> level.
  const tickSrc = loop((d, side) => fillGrains(d, ctx.sampleRate, side ? GRAIN_SEED_RIGHT : GRAIN_SEED))
  tickSrc.playbackRate.value = rest.rate
  const tickFilter = ctx.createBiquadFilter()
  tickFilter.type = 'highpass'
  tickFilter.frequency.value = 1500
  tickFilter.Q.value = 0.7
  const tickGain = ctx.createGain()
  tickGain.gain.value = 0
  tickSrc.connect(tickFilter)
  tickFilter.connect(tickGain)
  tickGain.connect(out)

  hissSrc.start()
  tickSrc.start()
  gust.start()

  let current = 0
  let disposed = false
  return {
    setLevel(level) {
      if (disposed) return
      const l = clamp01(level)
      if (Math.abs(l - current) < 0.002 && !(l === 0 && current !== 0)) return
      current = l
      const p = sandParams(l)
      const t = ctx.currentTime
      hissGain.gain.setTargetAtTime(p.hiss, t, HISS_TAU)
      gustDepth.gain.setTargetAtTime(p.gust, t, HISS_TAU)
      hissFilter.frequency.setTargetAtTime(p.freq, t, HISS_TAU)
      tickGain.gain.setTargetAtTime(p.ticks, t, TICK_TAU)
      tickSrc.playbackRate.setTargetAtTime(p.rate, t, TICK_TAU)
    },
    level: () => current,
    dispose() {
      if (disposed) return
      disposed = true
      for (const s of [hissSrc, tickSrc, gust]) {
        try {
          s.stop()
        } catch {
          // Already stopped.
        }
      }
      for (const node of [hissSrc, hissFilter, hissGain, gust, gustDepth, tickSrc, tickFilter, tickGain]) node.disconnect()
    },
  }
}
