/**
 * The pure half of the background score: notes, chords, the seeded random
 * generator, the event timeline, voice limits and the scheduler's look-ahead
 * maths. Nothing in this file touches `window`, timers or Web Audio, so it is
 * deterministic and unit-testable in a plain Node environment. `ambient.ts`
 * turns these events into sound.
 *
 * Key: A natural minor. Pad chords stay inside the key and the "particle"
 * plinks come from the A minor pentatonic, so any plink is consonant with any
 * chord (and `pickPlink` also steers clear of a semitone clash with the pad).
 */

/** Frequency in Hz of a MIDI note number (A4 = 69 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** Small, fast, seedable PRNG (mulberry32). Returns numbers in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Chord = {
  name: string
  /** Drone note (MIDI). Always a low note, one voice. */
  root: number
  /** Pad notes (MIDI), lowest first. */
  pad: readonly number[]
  /** How long this chord holds before the next one starts, seconds. */
  seconds: number
}

/**
 * Six chords, 60 s for one loop, each between 8 and 12 s:
 * Am9, Fmaj7, Cadd9, Gsus2, Dm9, Em7, then back to Am9.
 * Voicings are open and low-to-mid (E3 to B4) so the pad stays dark.
 */
export const PROGRESSION: readonly Chord[] = [
  { name: 'Am9', root: 45, pad: [52, 60, 64, 71], seconds: 10 }, // A2 | E3 C4 E4 B4
  { name: 'Fmaj7', root: 41, pad: [48, 57, 60, 64], seconds: 9 }, // F2 | C3 A3 C4 E4
  { name: 'Cadd9', root: 36, pad: [55, 59, 62, 64], seconds: 11 }, // C2 | G3 B3 D4 E4
  { name: 'Gsus2', root: 43, pad: [50, 55, 57, 62], seconds: 10 }, // G2 | D3 G3 A3 D4
  { name: 'Dm9', root: 38, pad: [53, 57, 60, 64], seconds: 12 }, // D2 | F3 A3 C4 E4
  { name: 'Em7', root: 40, pad: [47, 52, 55, 62], seconds: 8 }, // E2 | B2 E3 G3 D4
]

/** A minor pentatonic, E5 to A6 (about 660 to 1760 Hz): sparse and high. */
export const PLINK_SCALE: readonly number[] = [76, 79, 81, 84, 86, 88, 91, 93]

export const PLINK_MIN_GAP = 2.6
export const PLINK_MAX_GAP = 6.4
/** First plink never lands before this, so the pad settles in first. */
export const PLINK_FIRST_AT = 3.5

/** True when the note sits a semitone (in any octave) from a chord tone. */
export function clashesWithChord(midi: number, chord: Chord): boolean {
  for (const tone of [chord.root, ...chord.pad]) {
    const d = Math.abs(midi - tone) % 12
    if (d === 1 || d === 11) return true
  }
  return false
}

/**
 * Chooses the next plink from the scale: never one that clashes with the
 * current chord, never the same note twice in a row (when there is a choice),
 * and favouring small steps from the previous note so it sounds like a line.
 */
export function pickPlink(
  rng: () => number,
  previous: number | null,
  chord: Chord,
  scale: readonly number[] = PLINK_SCALE,
): number {
  let pool = scale.filter((n) => !clashesWithChord(n, chord))
  if (pool.length === 0) pool = [...scale]
  if (previous !== null && pool.length > 1) pool = pool.filter((n) => n !== previous)
  const weights = pool.map((n) => (previous === null ? 1 : 1 / (1 + Math.abs(n - previous) / 3)))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r < 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export type ScoreEvent =
  | { kind: 'chord'; time: number; index: number; chord: Chord }
  | { kind: 'plink'; time: number; midi: number; velocity: number; pan: number; chordIndex: number }

export type Timeline = {
  /** Time (seconds from the start) of the next event, without consuming it. */
  peekTime: () => number
  /** The next event; the timeline moves on. */
  next: () => ScoreEvent
}

export const SCORE_SEED = 0x6a7a

/**
 * An endless, deterministic stream of events in time order (seconds from the
 * start of the timeline). A chord event is at the start of each chord; plink
 * events fall between them. Same seed and start chord, same music.
 */
export function createTimeline(options: { seed?: number; startChord?: number } = {}): Timeline {
  const rng = createRng(options.seed ?? SCORE_SEED)
  const count = PROGRESSION.length
  let upcoming = (((options.startChord ?? 0) % count) + count) % count // the next chord to emit
  let chordTime = 0
  let current = upcoming // the chord sounding now (for plinks)
  let plinkTime = PLINK_FIRST_AT + rng() * 1.5
  let lastPlink: number | null = null

  const chordFirst = () => chordTime <= plinkTime

  return {
    peekTime: () => (chordFirst() ? chordTime : plinkTime),
    next(): ScoreEvent {
      if (chordFirst()) {
        const chord = PROGRESSION[upcoming]
        const event: ScoreEvent = { kind: 'chord', time: chordTime, index: upcoming, chord }
        current = upcoming
        chordTime += chord.seconds
        upcoming = (upcoming + 1) % count
        return event
      }
      const midi = pickPlink(rng, lastPlink, PROGRESSION[current])
      lastPlink = midi
      const event: ScoreEvent = {
        kind: 'plink',
        time: plinkTime,
        midi,
        velocity: 0.55 + rng() * 0.45,
        pan: (rng() * 2 - 1) * 0.6,
        chordIndex: current,
      }
      plinkTime += PLINK_MIN_GAP + rng() * (PLINK_MAX_GAP - PLINK_MIN_GAP)
      return event
    },
  }
}

/* ---------- Voice limits ---------- */

/** Pad notes sounding at once: two overlapping 4-note chords. */
export const MAX_PAD_VOICES = 8
/** Plinks sounding at once (each rings for about 3 s). */
export const MAX_PLINK_VOICES = 3

/** How many more voices may start. */
export function voiceBudget(active: number, max: number): number {
  return Math.max(0, max - active)
}

/** Keeps the lowest notes that fit the budget (the bottom of a chord matters most). */
export function takeVoices<T>(notes: readonly T[], free: number): T[] {
  return notes.slice(0, Math.max(0, free))
}

/* ---------- Scheduler window maths ---------- */

/** The scheduler wakes this often (milliseconds). */
export const TICK_MS = 200
/** Notes are scheduled this far ahead of the audio clock (seconds): three and a half ticks of slack. */
export const LOOKAHEAD_S = 0.7
/** An event this far behind the audio clock is too late to be worth playing (seconds). */
export const STALE_AFTER_S = 0.5
/** Safety valve: at most this many events are scheduled in one tick. */
export const MAX_EVENTS_PER_TICK = 24

/** Audio-clock time up to which events may be scheduled right now. */
export function scheduleHorizon(now: number, lookAhead: number = LOOKAHEAD_S): number {
  return now + lookAhead
}

/** An event at absolute audio time `at` is scheduled when it falls before the horizon. */
export function isDue(at: number, horizon: number): boolean {
  return at < horizon
}

export function isStale(at: number, now: number, tolerance: number = STALE_AFTER_S): boolean {
  return at < now - tolerance
}

/** A time that has already passed starts a hair after "now", never in the past. */
export function startTime(at: number, now: number, minLead = 0.02): number {
  return Math.max(at, now + minLead)
}

export type DueEvent = { event: ScoreEvent; at: number }

/**
 * Takes every event that falls inside the look-ahead window from the timeline.
 * `origin` is the audio-clock time of timeline second 0. Stale plinks are
 * dropped silently (a stalled main thread must not release a burst of notes);
 * stale chords still play, from `now`, so the pad never goes missing.
 */
export function drainDue(timeline: Timeline, origin: number, now: number, lookAhead: number = LOOKAHEAD_S): DueEvent[] {
  const horizon = scheduleHorizon(now, lookAhead)
  const due: DueEvent[] = []
  while (due.length < MAX_EVENTS_PER_TICK) {
    const at = origin + timeline.peekTime()
    if (!isDue(at, horizon)) break
    const event = timeline.next()
    if (event.kind === 'plink' && isStale(at, now)) continue
    due.push({ event, at: startTime(at, now) })
  }
  return due
}

/* ---------- Reverb impulse ---------- */

export const IMPULSE_SECONDS = 2.8

/**
 * Fills one channel of an impulse response: decaying noise that gets darker
 * as it fades (a one-pole low-pass that closes over time), with a 12 ms
 * fade-in so the reverb does not click. Pure; the caller supplies the RNG.
 */
export function fillImpulse(
  data: Float32Array,
  sampleRate: number,
  rng: () => number,
  seconds: number = IMPULSE_SECONDS,
  decay = 2.6,
): Float32Array {
  const length = Math.min(data.length, Math.floor(seconds * sampleRate))
  let low = 0
  for (let i = 0; i < data.length; i++) {
    if (i >= length) {
      data[i] = 0
      continue
    }
    const t = i / (seconds * sampleRate)
    const noise = rng() * 2 - 1
    const k = 0.7 - 0.55 * t // brighter at the start, darker in the tail
    low += (noise - low) * k
    const envelope = (1 - t) ** decay * Math.min(1, i / (0.012 * sampleRate))
    data[i] = low * envelope
  }
  return data
}
