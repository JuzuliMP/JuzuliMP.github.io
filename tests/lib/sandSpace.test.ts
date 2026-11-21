import { describe, expect, it } from 'vitest'
import {
  FAR_DRY_DROP,
  FAR_LOWPASS_HZ,
  HEIGHT_DB,
  NEAR_LOWPASS_HZ,
  PAN_RANGE,
  PLACE_TAU,
  REVERB_FAR,
  REVERB_NEAR,
  createSandSpace,
  panTrim,
  spaceParams,
  widthGains,
} from '../../app/lib/sandSpace'
import { FakeContext, FakeNode } from './ambientFakes'

const centre = { pan: 0, height: 0, width: 0.5, distance: 0 }

describe('widthGains', () => {
  it('passes full width through, and narrows to mono at 0', () => {
    expect(widthGains(1)).toEqual({ direct: 1, cross: 0 })
    const mono = widthGains(0)
    expect(mono.direct).toBeCloseTo(mono.cross, 12)
  })

  it('keeps the level as the sound narrows (power of uncorrelated sides)', () => {
    for (const w of [0, 0.25, 0.5, 1]) {
      const { direct, cross } = widthGains(w)
      expect(direct * direct + cross * cross).toBeCloseTo(1, 12)
    }
    expect(widthGains(Number.NaN)).toEqual(widthGains(0))
    expect(widthGains(3)).toEqual(widthGains(1))
  })
})

describe('spaceParams', () => {
  it('pans left and right, never fully hard', () => {
    expect(spaceParams({ ...centre, pan: 1 }).pan).toBe(PAN_RANGE)
    expect(spaceParams({ ...centre, pan: -5 }).pan).toBe(-PAN_RANGE)
    expect(PAN_RANGE).toBeLessThan(1)
    expect(spaceParams(centre).pan).toBe(0)
  })

  it('a panned sound is trimmed to stay as loud as a centred one', () => {
    expect(spaceParams(centre).trim).toBe(1)
    expect(panTrim(0.7, 1, 0)).toBe(1) // full width: the sides are unrelated, nothing to trim
    const narrow = spaceParams({ pan: 1, height: 0, width: 0.2, distance: 0 })
    expect(narrow.trim).toBeLessThan(0.8)
    expect(narrow.dry).toBeCloseTo(narrow.trim, 12)
    // Left and right are trimmed the same.
    expect(spaceParams({ pan: -1, height: 0, width: 0.2, distance: 0 }).trim).toBeCloseTo(narrow.trim, 12)
  })

  it('the echo comes back from the opposite side', () => {
    const p = spaceParams({ ...centre, pan: 1 })
    expect(p.reflectionPan).toBeLessThan(0)
    expect(spaceParams({ ...centre, pan: -1 }).reflectionPan).toBeGreaterThan(0)
  })

  it('higher is brighter, lower is darker', () => {
    expect(spaceParams({ ...centre, height: 1 }).shelfDb).toBe(HEIGHT_DB)
    expect(spaceParams({ ...centre, height: -1 }).shelfDb).toBe(-HEIGHT_DB)
    expect(spaceParams(centre).shelfDb).toBe(0)
  })

  it('far away is darker, quieter and more reverberant', () => {
    const near = spaceParams(centre)
    const far = spaceParams({ ...centre, distance: 1 })
    expect(near.lowpass).toBeCloseTo(NEAR_LOWPASS_HZ, 6)
    expect(far.lowpass).toBeCloseTo(FAR_LOWPASS_HZ, 6)
    expect(near.dry).toBe(1)
    expect(far.dry).toBeCloseTo(1 - FAR_DRY_DROP, 12)
    expect(near.reverb).toBe(REVERB_NEAR)
    expect(far.reverb).toBeCloseTo(REVERB_FAR, 12)
    expect(far.reflection).toBeGreaterThan(near.reflection)
  })
})

describe('createSandSpace', () => {
  const build = () => {
    const ctx = new FakeContext()
    const out = new FakeNode()
    const space = createSandSpace(ctx as unknown as AudioContext, out as unknown as AudioNode)
    return { ctx, out, space }
  }

  it('wires input -> width matrix -> pan -> height -> distance -> out, plus a reflection and a reverb', () => {
    const { ctx, out, space } = build()
    const [split] = ctx.splitters
    const [merge] = ctx.mergers
    expect((space.input as unknown as FakeNode).outputs).toContain(split)
    // Each output side takes its own side (direct) and the other side (cross).
    const toLeft = ctx.gains.filter((g) => g.routes.some((r) => r.target === merge && r.input === 0))
    const toRight = ctx.gains.filter((g) => g.routes.some((r) => r.target === merge && r.input === 1))
    expect(toLeft).toHaveLength(2)
    expect(toRight).toHaveLength(2)
    const [panner, reflPan] = ctx.panners
    expect(merge!.outputs).toContain(panner)
    const shelf = ctx.filters.find((f) => f.type === 'highshelf')!
    expect(panner!.outputs).toContain(shelf)
    const lowpass = shelf.outputs[0] as FakeNode
    // Dry, reflection (through the delay, panned) and reverb all reach the output.
    expect(ctx.gains.some((g) => lowpass.outputs.includes(g) && g.outputs.includes(out))).toBe(true)
    expect(ctx.delays).toHaveLength(1)
    expect(reflPan!.outputs).toContain(out)
    expect(ctx.convolvers[0]!.outputs).toContain(out)
    expect((ctx.convolvers[0]!.buffer as { numberOfChannels: number }).numberOfChannels).toBe(2)
  })

  it('glides every setting to a new place, or jumps there', () => {
    const { ctx, space } = build()
    const [panner, reflPan] = ctx.panners
    const shelf = ctx.filters.find((f) => f.type === 'highshelf')!
    space.setPlace({ pan: 1, height: 1, width: 0, distance: 1 })
    const p = spaceParams({ pan: 1, height: 1, width: 0, distance: 1 })
    expect(panner!.pan.last('setTargetAtTime')?.args).toEqual([p.pan, 0, PLACE_TAU])
    expect(reflPan!.pan.last('setTargetAtTime')?.args[0]).toBeCloseTo(p.reflectionPan, 12)
    expect(shelf.gain.last('setTargetAtTime')?.args[0]).toBe(HEIGHT_DB)
    const widthSet = ctx.gains.map((g) => g.gain.last('setTargetAtTime')?.args[0]).filter((v) => v !== undefined)
    expect(widthSet.filter((v) => Math.abs(v! - p.direct) < 1e-12).length).toBeGreaterThanOrEqual(2)
    space.setPlace({ pan: -1, height: 0, width: 1, distance: 0 }, true)
    expect(panner!.pan.last('setTargetAtTime')?.args).toEqual([-PAN_RANGE, 0, 0.005])
  })

  it('disconnects everything on dispose, then ignores new places', () => {
    const { ctx, space } = build()
    space.dispose()
    for (const n of [...ctx.gains, ...ctx.filters, ...ctx.panners, ...ctx.splitters, ...ctx.mergers, ...ctx.delays, ...ctx.convolvers])
      expect(n.disconnected).toBe(true)
    const n = ctx.panners[0]!.pan.calls.length
    space.setPlace({ pan: 1, height: 0, width: 0.5, distance: 0 })
    expect(ctx.panners[0]!.pan.calls.length).toBe(n)
  })

  it('still works where the browser has no splitter or stereo panner', () => {
    const ctx = new FakeContext() as unknown as Record<string, unknown>
    ctx.createChannelSplitter = undefined
    ctx.createStereoPanner = undefined
    const out = new FakeNode()
    const space = createSandSpace(ctx as unknown as AudioContext, out as unknown as AudioNode)
    expect(() => space.setPlace({ pan: 1, height: 1, width: 0, distance: 1 })).not.toThrow()
  })
})
