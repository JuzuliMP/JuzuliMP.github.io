// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  GUST_DEPTH,
  HISS_FREQ_MAX,
  HISS_FREQ_MIN,
  HISS_GAIN,
  SAND_RATE_MAX,
  SAND_RATE_MIN,
  SAND_VOLUME,
  TICK_GAIN,
  createSand,
  fillGrains,
  fillHiss,
  sandParams,
} from '../../app/lib/sand'
import { PAN_RANGE, PLACE_TAU, spaceParams } from '../../app/lib/sandSpace'
import { createSoundEngine } from '../../app/lib/sound'
import { FakeContext, FakeNode } from './ambientFakes'

describe('fillGrains', () => {
  it('is deterministic and peaks at 0.9', () => {
    const a = fillGrains(new Float32Array(8000), 8000)
    const b = fillGrains(new Float32Array(8000), 8000)
    expect(Array.from(a)).toEqual(Array.from(b))
    expect(a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeCloseTo(0.9, 5)
  })

  it('is sparse: sand ticks with silence between them, not continuous noise', () => {
    const sr = 44100
    const data = fillGrains(new Float32Array(sr), sr)
    const silent = data.filter((v) => v === 0).length / data.length
    expect(silent).toBeGreaterThan(0.6)
  })

  it('handles an empty buffer', () => {
    expect(fillGrains(new Float32Array(0), 44100)).toHaveLength(0)
  })
})

describe('fillHiss', () => {
  it('is deterministic soft noise within -1..1', () => {
    const a = fillHiss(new Float32Array(4000))
    expect(Array.from(a)).toEqual(Array.from(fillHiss(new Float32Array(4000))))
    expect(a.every((v) => Math.abs(v) <= 1)).toBe(true)
    expect(a.some((v) => v !== 0)).toBe(true)
  })
})

describe('sandParams', () => {
  it('is silent at rest', () => {
    for (const l of [0, 0.002, Number.NaN]) {
      const p = sandParams(l)
      expect(p.hiss).toBe(0)
      expect(p.gust).toBe(0)
      expect(p.ticks).toBe(0)
    }
  })

  it('gets louder, ticks faster and brightens with motion', () => {
    const ps = [0.05, 0.2, 0.5, 0.8, 1].map(sandParams)
    for (let i = 1; i < ps.length; i++) {
      expect(ps[i]!.hiss).toBeGreaterThan(ps[i - 1]!.hiss)
      expect(ps[i]!.ticks).toBeGreaterThan(ps[i - 1]!.ticks)
      expect(ps[i]!.rate).toBeGreaterThan(ps[i - 1]!.rate)
      expect(ps[i]!.freq).toBeGreaterThan(ps[i - 1]!.freq)
    }
    expect(sandParams(0).rate).toBe(SAND_RATE_MIN)
    expect(sandParams(0).freq).toBe(HISS_FREQ_MIN)
    expect(sandParams(5)).toEqual(sandParams(1))
  })

  it('plays drifting sand at 15% of the preview level', () => {
    expect(SAND_VOLUME).toBe(0.15)
    expect(sandParams(1)).toEqual({
      hiss: 0.15 * HISS_GAIN,
      gust: 0.15 * GUST_DEPTH,
      ticks: 0.15 * TICK_GAIN,
      rate: SAND_RATE_MAX,
      freq: HISS_FREQ_MAX,
    })
  })

  it('never lets a gust push the hiss level below zero', () => {
    for (const l of [0.01, 0.3, 1]) {
      const p = sandParams(l)
      expect(p.hiss - p.gust).toBeGreaterThanOrEqual(-1e-12)
    }
  })
})

describe('createSand', () => {
  it('builds a hiss layer (high-passed noise with a gust LFO) and a tick layer, both silent, into the output', () => {
    const ctx = new FakeContext()
    const out = new FakeNode()
    createSand(ctx as unknown as AudioContext, out as unknown as AudioNode)
    const [hissSrc, tickSrc] = ctx.sources
    expect(hissSrc!.loop).toBe(true)
    expect(tickSrc!.loop).toBe(true)
    expect(hissSrc!.start).toHaveBeenCalled()
    expect(tickSrc!.start).toHaveBeenCalled()
    expect(ctx.oscillators[0]!.start).toHaveBeenCalled()
    const [hissFilter, tickFilter] = ctx.filters
    expect(hissFilter!.type).toBe('highpass')
    expect(tickFilter!.type).toBe('highpass')
    // Stereo: each side has its own noise and grains, so the sand has width to place.
    for (const src of [hissSrc!, tickSrc!]) {
      const buf = src.buffer as { numberOfChannels: number; getChannelData: (c: number) => Float32Array }
      expect(buf.numberOfChannels).toBe(2)
      expect(Array.from(buf.getChannelData(0))).not.toEqual(Array.from(buf.getChannelData(1)))
    }
    expect(hissSrc!.outputs).toContain(hissFilter)
    expect(tickSrc!.outputs).toContain(tickFilter)
    const toOut = ctx.gains.filter((g) => g.outputs.includes(out))
    expect(toOut).toHaveLength(2)
    for (const g of toOut) expect(g.gain.value).toBe(0)
    // The gust depth gain modulates the hiss level.
    const hissGain = ctx.gains.find((g) => hissFilter!.outputs.includes(g))!
    expect(ctx.gains.some((g) => g.outputs.includes(hissGain.gain))).toBe(true)
  })

  it('glides every setting to the level (no steps, so no clicks)', () => {
    const ctx = new FakeContext()
    const out = new FakeNode()
    const sand = createSand(ctx as unknown as AudioContext, out as unknown as AudioNode)
    sand.setLevel(1)
    const p = sandParams(1)
    const hissGain = ctx.gains.find((g) => ctx.filters[0]!.outputs.includes(g))!
    const tickGain = ctx.gains.find((g) => ctx.filters[1]!.outputs.includes(g))!
    expect(hissGain.gain.last('setTargetAtTime')?.args[0]).toBeCloseTo(p.hiss, 12)
    expect(tickGain.gain.last('setTargetAtTime')?.args[0]).toBeCloseTo(p.ticks, 12)
    expect(ctx.sources[1]!.playbackRate.last('setTargetAtTime')?.args[0]).toBe(SAND_RATE_MAX)
    expect(ctx.filters[0]!.frequency.last('setTargetAtTime')?.args[0]).toBe(HISS_FREQ_MAX)
    sand.setLevel(0)
    expect(hissGain.gain.last('setTargetAtTime')?.args[0]).toBe(0)
    expect(tickGain.gain.last('setTargetAtTime')?.args[0]).toBe(0)
  })

  it('skips tiny changes, and stops and disconnects everything on dispose', () => {
    const ctx = new FakeContext()
    const sand = createSand(ctx as unknown as AudioContext, new FakeNode() as unknown as AudioNode)
    sand.setLevel(0.5)
    const tickGain = ctx.gains.find((g) => ctx.filters[1]!.outputs.includes(g))!
    const calls = tickGain.gain.calls.length
    sand.setLevel(0.5005)
    expect(tickGain.gain.calls.length).toBe(calls)
    sand.dispose()
    for (const s of ctx.sources) {
      expect(s.stop).toHaveBeenCalled()
      expect(s.disconnected).toBe(true)
    }
    expect(ctx.oscillators[0]!.stop).toHaveBeenCalled()
    expect(ctx.gains.every((g) => g.disconnected)).toBe(true)
    sand.setLevel(1)
    expect(tickGain.gain.calls.length).toBe(calls)
  })
})

describe('sound engine: motion', () => {
  beforeEach(() => {
    FakeContext.instances = []
    ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeContext
  })
  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
  })

  // The tick layer: the gain after the 1500 Hz high-pass (the score's own filters are low-pass).
  const tickGainOf = (ctx: FakeContext) => {
    const f = ctx.filters.find((x) => x.type === 'highpass' && x.frequency.value === 1500)
    return ctx.gains.find((g) => f?.outputs.includes(g))!
  }

  it('does nothing before unlock, and builds the sand only once something moves', () => {
    const engine = createSoundEngine()
    engine.motion(1)
    expect(FakeContext.instances).toHaveLength(0)
    engine.unlock()
    const ctx = FakeContext.instances[0]!
    engine.motion(0)
    expect(ctx.sources).toHaveLength(0)
    engine.motion(0.6)
    expect(ctx.sources).toHaveLength(2)
    engine.motion(0.8)
    expect(ctx.sources).toHaveLength(2)
    const tickGain = tickGainOf(ctx)
    // The sand goes through its space stage (split for the width matrix), which feeds the master.
    const spaceInput = tickGain.outputs[0] as FakeNode
    expect(spaceInput.outputs).toContain(ctx.splitters[0])
    expect(ctx.gains.some((g) => g !== spaceInput && g.outputs.includes(ctx.gains[0]))).toBe(true)
    expect(ctx.convolvers[0]!.outputs).toContain(ctx.gains[0])
    expect(tickGain.gain.last('setTargetAtTime')?.args[0]).toBeCloseTo(sandParams(0.8).ticks, 10)
  })

  it('moves the sand to where the particles move, and jumps there when it starts from silence', () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = FakeContext.instances[0]!
    engine.motion(0.5, { pan: 1, height: 0, width: 0.3, distance: 0 })
    const [panner] = ctx.panners
    // From silence: a near-instant move, so the sound does not swoop across.
    expect(panner!.pan.last('setTargetAtTime')?.args).toEqual([spaceParams({ pan: 1, height: 0, width: 0.3, distance: 0 }).pan, 0, 0.005])
    engine.motion(0.6, { pan: -1, height: 0, width: 0.3, distance: 0 })
    expect(panner!.pan.last('setTargetAtTime')?.args).toEqual([-PAN_RANGE, 0, PLACE_TAU])
    // No place: it stays where it was.
    const n = panner!.pan.calls.length
    engine.motion(0.7)
    expect(panner!.pan.calls.length).toBe(n)
  })

  it('is silenced by "sound off" and ignores motion until sound is back on', () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = FakeContext.instances[0]!
    engine.startScore()
    engine.motion(0.7)
    engine.stopScore()
    const tickGain = tickGainOf(ctx)
    expect(tickGain.gain.last('setTargetAtTime')?.args[0]).toBe(0)
    const n = tickGain.gain.calls.length
    engine.motion(0.9)
    expect(tickGain.gain.calls.length).toBe(n)
    engine.startScore()
    engine.motion(0.9)
    expect(tickGain.gain.last('setTargetAtTime')?.args[0]).toBeCloseTo(sandParams(0.9).ticks, 10)
  })

  it('disposes the sand on close', () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = FakeContext.instances[0]!
    engine.motion(0.5)
    engine.close()
    expect(ctx.sources[0]!.stop).toHaveBeenCalled()
    engine.motion(0.5)
    expect(ctx.sources).toHaveLength(2)
  })
})
