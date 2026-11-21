import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SCORE_FADE_IN, SCORE_GAIN, createAmbient } from '../../app/lib/ambient'
import { MAX_PAD_VOICES, MAX_PLINK_VOICES, PROGRESSION, TICK_MS, midiToFreq } from '../../app/lib/ambientScore'
import { FakeContext, FakeNode, liveOscillators } from './ambientFakes'

let ctx: FakeContext
let out: FakeNode
const asCtx = () => ctx as unknown as AudioContext

/** Moves the audio clock and the timers forward together, one scheduler tick at a time. */
function advance(seconds: number) {
  const ticks = Math.round((seconds * 1000) / TICK_MS)
  for (let i = 0; i < ticks; i++) {
    ctx.currentTime += TICK_MS / 1000
    vi.advanceTimersByTime(TICK_MS)
  }
}

const make = () => createAmbient(asCtx(), out as unknown as AudioNode)

beforeEach(() => {
  vi.useFakeTimers()
  FakeContext.instances = []
  ctx = new FakeContext()
  ctx.state = 'running'
  out = new FakeNode()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createAmbient', () => {
  it('builds nothing until started', () => {
    make()
    expect(ctx.gains).toHaveLength(0)
    expect(ctx.oscillators).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('builds the graph: bus to the output, a convolver with a generated impulse, a feedback delay', () => {
    const ambient = make()
    ambient.start()
    const [mix, bus] = ctx.gains
    expect(mix.outputs).toContain(bus)
    expect(bus.outputs).toContain(out)
    expect(ctx.convolvers).toHaveLength(1)
    const buffer = ctx.convolvers[0].buffer as { numberOfChannels: number; getChannelData: (c: number) => Float32Array }
    expect(buffer.numberOfChannels).toBe(2)
    expect(Array.from(buffer.getChannelData(0)).some((x) => x !== 0)).toBe(true)
    expect(ctx.delays).toHaveLength(1)
    // Feedback: the delay's filtered output is routed back into the delay.
    const feedbackLoop = ctx.gains.some((g) => g.outputs.includes(ctx.delays[0]))
    expect(feedbackLoop).toBe(true)
    ambient.dispose()
  })

  it('fades the bus in from silence to the score gain over about 3 s', () => {
    // Subtle background: tuned by measurement to about -33 dBFS RMS through the master.
    expect(SCORE_GAIN).toBeGreaterThanOrEqual(0.08)
    expect(SCORE_GAIN).toBeLessThanOrEqual(0.14)
    const ambient = make()
    ambient.start()
    const bus = ctx.gains[1].gain
    expect(bus.value).toBe(0)
    const ramp = bus.last('linearRampToValueAtTime')!
    expect(ramp.args[0]).toBe(SCORE_GAIN)
    expect(ramp.args[1] - ctx.currentTime).toBeCloseTo(SCORE_FADE_IN, 5)
    expect(SCORE_FADE_IN).toBe(3)
    ambient.dispose()
  })

  it('starts the opening chord straight away: 4 pad notes (two oscillators each), an LFO-swept low-pass, a drone', () => {
    const ambient = make()
    ambient.start()
    expect(ambient.running()).toBe(true)
    const chord = PROGRESSION[0]
    // 4 notes x 2 detuned oscillators + 1 LFO + 1 drone
    expect(ctx.oscillators).toHaveLength(chord.pad.length * 2 + 2)
    const freqs = ctx.oscillators.map((o) => o.frequency.calls[0]?.args[0])
    expect(freqs).toContain(midiToFreq(chord.root))
    for (const note of chord.pad) expect(freqs).toContain(midiToFreq(note))
    const detunes = ctx.oscillators.map((o) => o.detune.calls[0]?.args[0]).filter((d) => d !== undefined)
    expect(detunes.some((d) => d! < 0)).toBe(true)
    expect(detunes.some((d) => d! > 0)).toBe(true)
    expect(ctx.filters.length).toBeGreaterThan(0)
    const padFilter = ctx.filters.at(-1)! // the delay's tone filter is built first
    expect(padFilter.type).toBe('lowpass')
    const lfoDepth = ctx.gains.find((g) => g.outputs.includes(padFilter.frequency))
    expect(lfoDepth).toBeDefined()
    expect(ambient.voices()).toBe(chord.pad.length)
    ambient.dispose()
  })

  it('schedules the next chord about a chord-length later and glides the drone to the new root', () => {
    const ambient = make()
    ambient.start()
    const before = ctx.oscillators.length
    advance(PROGRESSION[0].seconds - 1)
    expect(ctx.oscillators.filter((o) => o.start.mock.calls.length).length).toBeGreaterThan(before - 1)
    advance(2)
    const drone = ctx.oscillators.find((o) => o.frequency.calls[0]?.args[0] === midiToFreq(PROGRESSION[0].root))!
    const glide = drone.frequency.last('setTargetAtTime')!
    expect(glide.args[0]).toBeCloseTo(midiToFreq(PROGRESSION[1].root), 6)
    ambient.dispose()
  })

  it('plays sparse plinks from the scale and sends them through the delay', () => {
    const ambient = make()
    ambient.start()
    advance(40)
    const plinkFreqs = ctx.oscillators
      .map((o) => o.frequency.calls[0]?.args[0])
      .filter((f): f is number => typeof f === 'number' && f > midiToFreq(75))
    expect(plinkFreqs.length).toBeGreaterThan(0)
    // 40 s with a 2.6 s minimum gap: at most 16 plinks (two oscillators each).
    expect(plinkFreqs.length / 2).toBeLessThanOrEqual(16)
    expect(ctx.panners.length).toBeGreaterThan(0)
    expect(ctx.panners[0].outputs.length).toBe(2) // dry to the mix and a send to the delay
    ambient.dispose()
  })

  it('caps simultaneous voices however long it runs', () => {
    const ambient = make()
    ambient.start()
    let peak = 0
    for (let i = 0; i < 400; i++) {
      advance(0.2)
      peak = Math.max(peak, ambient.voices())
    }
    expect(peak).toBeGreaterThan(0)
    expect(peak).toBeLessThanOrEqual(MAX_PAD_VOICES + MAX_PLINK_VOICES)
    ambient.dispose()
  })

  it('disconnects the nodes of voices that finished', () => {
    const ambient = make()
    ambient.start()
    const initial = [...ctx.oscillators]
    advance(30)
    // Simulate the browser ending everything that was due to stop by now.
    for (const o of ctx.oscillators) {
      const stopAt = o.stop.mock.calls[0]?.[0] as number | undefined
      if (stopAt !== undefined && stopAt <= ctx.currentTime) o.finish()
    }
    const finishedPad = initial.filter((o) => o.stop.mock.calls.length && o.disconnected)
    expect(finishedPad.length).toBeGreaterThan(0)
    expect(ambient.voices()).toBeLessThan(MAX_PAD_VOICES + MAX_PLINK_VOICES + 1)
    ambient.dispose()
  })

  it('stop() halts the scheduler at once, fades the bus out fast, then silences every voice', () => {
    const ambient = make()
    ambient.start()
    advance(6)
    const timersRunning = vi.getTimerCount()
    expect(timersRunning).toBeGreaterThan(0)
    const startedBefore = ctx.oscillators.length
    ambient.stop(0.2)
    expect(ambient.running()).toBe(false)
    const bus = ctx.gains[1].gain
    const fade = bus.last('linearRampToValueAtTime')!
    expect(fade.args[0]).toBe(0)
    expect(fade.args[1] - ctx.currentTime).toBeLessThanOrEqual(0.3)
    // No more scheduling while stopped.
    advance(5)
    expect(ctx.oscillators.length).toBe(startedBefore)
    // After the fade, every voice was stopped and disconnected, and no timer is left.
    expect(liveOscillators(ctx)).toHaveLength(0)
    expect(ambient.voices()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('restarts where it left off: same chord first, with a fresh fade-in', () => {
    const ambient = make()
    ambient.start()
    advance(PROGRESSION[0].seconds + 2) // now inside the second chord
    ambient.stop(0.2)
    advance(0.5)
    const count = ctx.oscillators.length
    ambient.start(0.8)
    const fresh = ctx.oscillators.slice(count)
    const freqs = fresh.map((o) => o.frequency.calls[0]?.args[0])
    expect(freqs).toContain(midiToFreq(PROGRESSION[1].root))
    for (const note of PROGRESSION[1].pad) expect(freqs).toContain(midiToFreq(note))
    const ramp = ctx.gains[1].gain.last('linearRampToValueAtTime')!
    expect(ramp.args[0]).toBe(SCORE_GAIN)
    expect(ramp.args[1] - ctx.currentTime).toBeCloseTo(0.8, 5)
    ambient.dispose()
  })

  it('start() while already running changes nothing', () => {
    const ambient = make()
    ambient.start()
    const n = ctx.oscillators.length
    const timers = vi.getTimerCount()
    ambient.start()
    expect(ctx.oscillators.length).toBe(n)
    expect(vi.getTimerCount()).toBe(timers)
    ambient.dispose()
  })

  it('dispose() clears timers and leaves nothing playing', () => {
    const ambient = make()
    ambient.start()
    advance(3)
    ambient.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(liveOscillators(ctx)).toHaveLength(0)
  })

  it('works without a StereoPanner (older Safari)', () => {
    ;(ctx as unknown as { createStereoPanner?: unknown }).createStereoPanner = undefined
    const ambient = make()
    ambient.start()
    expect(() => advance(30)).not.toThrow()
    ambient.dispose()
  })
})
