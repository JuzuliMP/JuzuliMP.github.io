import { describe, expect, it } from 'vitest'
import {
  IMPULSE_SECONDS,
  LOOKAHEAD_S,
  MAX_EVENTS_PER_TICK,
  MAX_PAD_VOICES,
  MAX_PLINK_VOICES,
  PLINK_FIRST_AT,
  PLINK_MAX_GAP,
  PLINK_MIN_GAP,
  PLINK_SCALE,
  PROGRESSION,
  STALE_AFTER_S,
  TICK_MS,
  clashesWithChord,
  createRng,
  createTimeline,
  drainDue,
  fillImpulse,
  isDue,
  isStale,
  midiToFreq,
  pickPlink,
  scheduleHorizon,
  startTime,
  takeVoices,
  voiceBudget,
  type ScoreEvent,
} from '../../app/lib/ambientScore'

const pitchClass = (n: number) => ((n % 12) + 12) % 12
const A_MINOR_PENTATONIC = new Set([9, 0, 2, 4, 7]) // A C D E G
const A_MINOR = new Set([9, 11, 0, 2, 4, 5, 7])

describe('midiToFreq', () => {
  it('maps A4 to 440 Hz and doubles per octave', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6)
    expect(midiToFreq(81)).toBeCloseTo(880, 6)
    expect(midiToFreq(45)).toBeCloseTo(110, 6)
  })
})

describe('createRng', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = createRng(123)
    const b = createRng(123)
    const xs = Array.from({ length: 200 }, () => a())
    expect(xs).toEqual(Array.from({ length: 200 }, () => b()))
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
    expect(Array.from({ length: 5 }, createRng(124))).not.toEqual(xs.slice(0, 5))
  })
})

describe('progression', () => {
  it('is a fixed six-chord loop with every chord held 8 to 12 seconds', () => {
    expect(PROGRESSION.map((c) => c.name)).toEqual(['Am9', 'Fmaj7', 'Cadd9', 'Gsus2', 'Dm9', 'Em7'])
    for (const chord of PROGRESSION) {
      expect(chord.seconds).toBeGreaterThanOrEqual(8)
      expect(chord.seconds).toBeLessThanOrEqual(12)
    }
  })

  it('stays in A minor and keeps the pad dark (E3 to B4) over a low drone', () => {
    for (const chord of PROGRESSION) {
      for (const note of [chord.root, ...chord.pad]) expect(A_MINOR.has(pitchClass(note))).toBe(true)
      expect(chord.root).toBeLessThanOrEqual(45)
      expect(chord.pad.length).toBe(4)
      for (const note of chord.pad) {
        expect(note).toBeGreaterThanOrEqual(47)
        expect(note).toBeLessThanOrEqual(71)
      }
      expect([...chord.pad]).toEqual([...chord.pad].sort((a, b) => a - b))
    }
  })
})

describe('plink scale and picker', () => {
  it('is A minor pentatonic, high and ascending', () => {
    for (const n of PLINK_SCALE) expect(A_MINOR_PENTATONIC.has(pitchClass(n))).toBe(true)
    expect([...PLINK_SCALE]).toEqual([...PLINK_SCALE].sort((a, b) => a - b))
    expect(Math.min(...PLINK_SCALE)).toBeGreaterThanOrEqual(76)
  })

  it('never picks a note a semitone from a chord tone', () => {
    for (const chord of PROGRESSION) {
      const rng = createRng(7)
      let prev: number | null = null
      for (let i = 0; i < 100; i++) {
        const note = pickPlink(rng, prev, chord)
        expect(PLINK_SCALE).toContain(note)
        expect(clashesWithChord(note, chord)).toBe(false)
        prev = note
      }
    }
  })

  it('detects clashes in any octave', () => {
    const am9 = PROGRESSION[0] // has B: C (pitch class 0) is a semitone away
    expect(clashesWithChord(84, am9)).toBe(true)
    expect(clashesWithChord(88, am9)).toBe(false)
  })

  it('does not repeat the previous note and prefers small steps', () => {
    const chord = PROGRESSION[3] // Gsus2: nothing in the scale clashes
    const rng = createRng(42)
    let prev: number | null = null
    const steps: number[] = []
    for (let i = 0; i < 400; i++) {
      const note = pickPlink(rng, prev, chord)
      if (prev !== null) {
        expect(note).not.toBe(prev)
        steps.push(Math.abs(note - prev))
      }
      prev = note
    }
    const small = steps.filter((s) => s <= 5).length
    expect(small / steps.length).toBeGreaterThan(0.5)
  })

  it('is seeded: the same seed gives the same line', () => {
    const line = (seed: number) => {
      const rng = createRng(seed)
      let prev: number | null = null
      return Array.from({ length: 30 }, () => (prev = pickPlink(rng, prev, PROGRESSION[0])))
    }
    expect(line(1)).toEqual(line(1))
    expect(line(1)).not.toEqual(line(2))
  })
})

function take(count: number, options?: Parameters<typeof createTimeline>[0]) {
  const timeline = createTimeline(options)
  return Array.from({ length: count }, () => timeline.next())
}

describe('timeline', () => {
  it('is deterministic and in time order', () => {
    const a = take(60)
    const b = take(60)
    expect(a).toEqual(b)
    for (let i = 1; i < a.length; i++) expect(a[i].time).toBeGreaterThanOrEqual(a[i - 1].time)
  })

  it('opens with the first chord at 0 and cycles the progression in order', () => {
    const events = take(80)
    expect(events[0]).toMatchObject({ kind: 'chord', time: 0, index: 0 })
    const chords = events.filter((e): e is Extract<ScoreEvent, { kind: 'chord' }> => e.kind === 'chord')
    chords.forEach((c, i) => expect(c.index).toBe(i % PROGRESSION.length))
    for (let i = 1; i < chords.length; i++) {
      expect(chords[i].time - chords[i - 1].time).toBe(PROGRESSION[chords[i - 1].index].seconds)
    }
    // One loop is 60 s.
    expect(chords[PROGRESSION.length].time).toBe(60)
  })

  it('can start from any chord (to resume where it left off)', () => {
    const events = take(5, { startChord: 4 })
    expect(events[0]).toMatchObject({ kind: 'chord', time: 0, index: 4 })
    const second = events.find((e) => e.kind === 'chord' && e.time > 0)
    expect(second).toMatchObject({ index: 5 })
  })

  it('keeps plinks sparse: first after the pad settles, then 2.6 to 6.4 s apart', () => {
    const plinks = take(400).filter((e): e is Extract<ScoreEvent, { kind: 'plink' }> => e.kind === 'plink')
    expect(plinks.length).toBeGreaterThan(20)
    expect(plinks[0].time).toBeGreaterThanOrEqual(PLINK_FIRST_AT)
    for (let i = 1; i < plinks.length; i++) {
      const gap = plinks[i].time - plinks[i - 1].time
      expect(gap).toBeGreaterThanOrEqual(PLINK_MIN_GAP - 1e-9)
      expect(gap).toBeLessThanOrEqual(PLINK_MAX_GAP + 1e-9)
    }
    // Never busier than one plink per 2.6 s.
    const span = plinks.at(-1)!.time - plinks[0].time
    expect((plinks.length - 1) / span).toBeLessThanOrEqual(1 / PLINK_MIN_GAP + 1e-9)
  })

  it('gives plinks a valid note, velocity and pan, consonant with the chord playing', () => {
    for (const e of take(300)) {
      if (e.kind !== 'plink') continue
      expect(PLINK_SCALE).toContain(e.midi)
      expect(e.velocity).toBeGreaterThanOrEqual(0.55)
      expect(e.velocity).toBeLessThanOrEqual(1)
      expect(Math.abs(e.pan)).toBeLessThanOrEqual(0.6)
      expect(clashesWithChord(e.midi, PROGRESSION[e.chordIndex])).toBe(false)
    }
  })

  it('peekTime reports the next event time without consuming it', () => {
    const t = createTimeline()
    expect(t.peekTime()).toBe(0)
    expect(t.peekTime()).toBe(0)
    const first = t.next()
    expect(first.time).toBe(0)
    expect(t.peekTime()).toBeGreaterThan(0)
  })
})

describe('voice limits', () => {
  it('computes the remaining budget and never goes negative', () => {
    expect(voiceBudget(0, MAX_PAD_VOICES)).toBe(MAX_PAD_VOICES)
    expect(voiceBudget(3, MAX_PLINK_VOICES)).toBe(0)
    expect(voiceBudget(99, MAX_PLINK_VOICES)).toBe(0)
  })

  it('takes the lowest notes that fit', () => {
    expect(takeVoices([52, 60, 64, 71], 2)).toEqual([52, 60])
    expect(takeVoices([52, 60], 5)).toEqual([52, 60])
    expect(takeVoices([52, 60], 0)).toEqual([])
    expect(takeVoices([52, 60], -3)).toEqual([])
  })

  it('has caps that fit two overlapping chords and a few plinks', () => {
    expect(MAX_PAD_VOICES).toBeGreaterThanOrEqual(PROGRESSION[0].pad.length * 2)
    expect(MAX_PLINK_VOICES).toBeLessThanOrEqual(4)
  })
})

describe('scheduler window maths', () => {
  it('looks ahead further than one tick, but only a little', () => {
    expect(LOOKAHEAD_S * 1000).toBeGreaterThan(TICK_MS * 2)
    expect(LOOKAHEAD_S).toBeLessThan(1)
    expect(TICK_MS).toBe(200)
  })

  it('horizon, due and stale', () => {
    expect(scheduleHorizon(10)).toBeCloseTo(10 + LOOKAHEAD_S, 9)
    expect(scheduleHorizon(10, 2)).toBe(12)
    expect(isDue(10.5, 10.7)).toBe(true)
    expect(isDue(10.7, 10.7)).toBe(false)
    expect(isStale(9.4, 10)).toBe(true)
    expect(isStale(10 - STALE_AFTER_S, 10)).toBe(false)
  })

  it('never starts in the past', () => {
    expect(startTime(5, 10)).toBeGreaterThan(10)
    expect(startTime(12, 10)).toBe(12)
  })

  it('drains only events inside the window and leaves the rest', () => {
    const timeline = createTimeline()
    const first = drainDue(timeline, 100, 100, LOOKAHEAD_S)
    expect(first).toHaveLength(1) // the opening chord at t=0; the first plink is >= 3.5 s away
    expect(first[0].event.kind).toBe('chord')
    expect(first[0].at).toBeGreaterThanOrEqual(100)
    expect(drainDue(timeline, 100, 100.2, LOOKAHEAD_S)).toHaveLength(0)
    // A tick that finds a plink inside the window returns it at its absolute time.
    const probe = createTimeline()
    probe.next()
    const plinkTime = probe.peekTime()
    expect(drainDue(timeline, 100, 100 + plinkTime - LOOKAHEAD_S - 0.05, LOOKAHEAD_S)).toHaveLength(0)
    const later = drainDue(timeline, 100, 100 + plinkTime - 0.3, LOOKAHEAD_S)
    expect(later).toHaveLength(1)
    expect(later[0].event.kind).toBe('plink')
    expect(later[0].at).toBe(100 + later[0].event.time)
  })

  it('schedules every event exactly once across successive ticks', () => {
    const timeline = createTimeline()
    const seen: number[] = []
    for (let now = 0; now <= 130; now += TICK_MS / 1000) {
      for (const { event } of drainDue(timeline, 0, now)) seen.push(event.time)
    }
    expect(seen).toEqual(take(seen.length).map((e) => e.time))
    // Two full loops of chords were scheduled in 130 s.
    expect(seen.length).toBeGreaterThan(12)
  })

  it('drops stale plinks after a stall but still plays a stale chord, from now', () => {
    const timeline = createTimeline()
    // The main thread stalled for 20 s: everything up to t=20 is overdue.
    const due = drainDue(timeline, 0, 20)
    expect(due.every((d) => d.at >= 20)).toBe(true)
    expect(due.some((d) => d.event.kind === 'plink')).toBe(false)
    expect(due.filter((d) => d.event.kind === 'chord').length).toBeGreaterThanOrEqual(1)
  })

  it('caps the events handled in one tick', () => {
    const timeline = createTimeline()
    expect(drainDue(timeline, 0, 100000).length).toBeLessThanOrEqual(MAX_EVENTS_PER_TICK)
  })
})

describe('fillImpulse', () => {
  it('makes a finite, decaying, fade-in noise tail', () => {
    const rate = 8000
    const data = fillImpulse(new Float32Array(Math.floor(IMPULSE_SECONDS * rate)), rate, createRng(5))
    expect(data.every((x) => Number.isFinite(x))).toBe(true)
    const rms = (from: number, to: number) => {
      let sum = 0
      for (let i = from; i < to; i++) sum += data[i] * data[i]
      return Math.sqrt(sum / (to - from))
    }
    const n = data.length
    expect(rms(0, Math.floor(0.01 * rate))).toBeLessThan(rms(Math.floor(0.05 * rate), Math.floor(0.3 * rate))) // faded in
    expect(rms(Math.floor(0.05 * rate), Math.floor(0.3 * rate))).toBeGreaterThan(rms(Math.floor(n * 0.7), n)) // decays
    expect(Math.abs(data[n - 1])).toBeLessThan(0.005)
    expect(Math.max(...Array.from(data, Math.abs))).toBeLessThanOrEqual(1)
  })

  it('is deterministic for a seed', () => {
    const make = () => fillImpulse(new Float32Array(2000), 1000, createRng(9), 2)
    expect(Array.from(make())).toEqual(Array.from(make()))
  })
})
