/**
 * Site sound, synthesised with the Web Audio API. There are no audio files:
 * the interface sounds are one or two short sine / triangle blips shaped by a
 * gain envelope, and the background score (see `ambient.ts`) is generated live.
 *
 * Sound is on by default, but browsers block audio until a user gesture, so
 * the AudioContext is created lazily by `unlock()`, which must be called from
 * a gesture. Nothing plays and nothing is created before that.
 *
 * The particles also make a soft "moving sand" sound while they move (see `sand.ts`),
 * placed around the listener where the particles move (see `sandSpace.ts`).
 *
 * Signal path: UI blips, the sand (through its space stage) and the score bus -> master gain (also the fast
 * fade-out for "sound off") -> DynamicsCompressor (a safety limiter) -> speakers.
 */
import { SCORE_FADE_IN, createAmbient, type Ambient } from './ambient'
import { createSand, type Sand } from './sand'
import { createSandSpace, type SandSpace, type SoundPlace } from './sandSpace'

export type SoundName = 'hover' | 'click' | 'toggle'

/**
 * Master level, shared by the interface sounds and the score. The blip peaks
 * below are written as fractions of 1 and scaled by UI_SCALE, so a UI sound's
 * final level is peak x 0.12. Measured in Chrome, this puts the score at about
 * -33 dBFS RMS (-22 dBFS peaks): quiet background, while the short UI ticks
 * (about -28 to -22 dBFS peaks) still cut through it.
 */
export const MASTER_GAIN = 0.6
export const UI_SCALE = 0.2
/** "Sound off" fades everything out in this many seconds (WCAG 1.4.2: well under 300 ms is "immediate"). */
export const FADE_OUT_SECONDS = 0.2
/** Fade of the master back up when sound starts. */
export const MASTER_FADE_IN_SECONDS = 0.05
/** Minimum gap between two hover ticks (seconds of audio time). */
export const HOVER_THROTTLE = 0.07

export const SOUND_STORAGE_KEY = 'juzuli-sound'

type Tone = {
  freq: number
  /** Start offset from now, seconds. */
  at: number
  /** Total length including the decay, seconds. */
  length: number
  /** Peak level 0..1 (before the master gain). */
  peak: number
  type: OscillatorType
}

/** Note E5 then B5: a gentle rising fifth. */
const RECIPES: Record<SoundName, Tone[]> = {
  hover: [{ freq: 1500, at: 0, length: 0.04, peak: 0.32, type: 'triangle' }],
  click: [
    { freq: 2100, at: 0, length: 0.07, peak: 0.55, type: 'triangle' },
    { freq: 1050, at: 0, length: 0.09, peak: 0.3, type: 'sine' },
  ],
  toggle: [
    { freq: 659.25, at: 0, length: 0.42, peak: 0.7, type: 'sine' },
    { freq: 987.77, at: 0.11, length: 0.5, peak: 0.55, type: 'sine' },
  ],
}

const ATTACK = 0.006
const FLOOR = 0.0001

type AudioContextCtor = new () => AudioContext

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

export type SoundEngine = {
  /** Creates (first call) and resumes the AudioContext. Call from a user gesture. Returns false if Web Audio is unavailable. */
  unlock: () => boolean
  /** Resolves after the latest resume attempt: true when the context is actually running. */
  whenRunning: () => Promise<boolean>
  play: (name: SoundName) => void
  /** True once a context exists. */
  ready: () => boolean
  /** Starts the background score (fade-in) and brings the master up. Idempotent. Needs `unlock()` first. */
  startScore: (fadeIn?: number) => void
  /** Fades everything out fast, stops the scheduler, and suspends the context once silent. */
  stopScore: () => void
  /** True while the score is scheduled and not faded out. */
  scoreActive: () => boolean
  /**
   * How much the particles are moving (0..1), and where (left / right, height,
   * width, distance); drives the sand sound. Ignored until unlocked and while
   * sound is off. Without a place the sand stays where it last was.
   */
  motion: (level: number, place?: SoundPlace) => void
  close: () => void
}

export function createSoundEngine(): SoundEngine {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let ambient: Ambient | null = null
  let sand: Sand | null = null
  let space: SandSpace | null = null
  let suspendTimer: ReturnType<typeof setTimeout> | null = null
  let running: Promise<boolean> = Promise.resolve(false)
  let muted = false // true between stopScore() and the next startScore()
  let lastHover = -Infinity

  function resumeContext(c: AudioContext) {
    running = Promise.resolve(c.state === 'suspended' ? c.resume?.() : undefined)
      .then(() => c.state === 'running')
      .catch(() => false)
  }

  function unlock() {
    if (!ctx) {
      const Ctor = audioContextCtor()
      if (!Ctor) return false
      try {
        const c = new Ctor()
        const m = c.createGain()
        m.gain.value = MASTER_GAIN
        if (typeof c.createDynamicsCompressor === 'function') {
          // Safety limiter: a fast, hard compressor that only acts on stray peaks.
          const limiter = c.createDynamicsCompressor()
          limiter.threshold.value = -12
          limiter.knee.value = 6
          limiter.ratio.value = 20
          limiter.attack.value = 0.003
          limiter.release.value = 0.25
          m.connect(limiter)
          limiter.connect(c.destination)
        } else {
          m.connect(c.destination)
        }
        ctx = c
        master = m
      } catch {
        ctx = null
        master = null
        return false
      }
    }
    resumeContext(ctx)
    return true
  }

  function rampMaster(target: number, seconds: number) {
    if (!ctx || !master) return
    const p = master.gain
    const now = ctx.currentTime
    p.cancelScheduledValues?.(now)
    p.setValueAtTime(p.value, now)
    p.linearRampToValueAtTime(target, now + seconds)
  }

  function clearSuspendTimer() {
    if (suspendTimer !== null) {
      clearTimeout(suspendTimer)
      suspendTimer = null
    }
  }

  function startScore(fadeIn: number = SCORE_FADE_IN) {
    if (!ctx || !master || ctx.state === 'closed') return
    clearSuspendTimer()
    const wasMuted = muted
    muted = false
    if (ctx.state === 'suspended') resumeContext(ctx)
    if (wasMuted) rampMaster(MASTER_GAIN, MASTER_FADE_IN_SECONDS)
    ambient ??= createAmbient(ctx, master)
    ambient.start(fadeIn)
  }

  function stopScore() {
    if (!ctx || !master || ctx.state === 'closed') return
    const c = ctx
    muted = true
    rampMaster(0, FADE_OUT_SECONDS)
    ambient?.stop(FADE_OUT_SECONDS)
    sand?.setLevel(0)
    clearSuspendTimer()
    // Suspend once the fade has finished: no audio thread work while off or hidden.
    suspendTimer = setTimeout(() => {
      suspendTimer = null
      if (muted && c.state === 'running') void Promise.resolve(c.suspend?.()).catch(() => {})
    }, FADE_OUT_SECONDS * 1000 + 80)
  }

  function blip(tone: Tone) {
    if (!ctx || !master) return
    const t0 = ctx.currentTime + tone.at
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = tone.type
    osc.frequency.setValueAtTime(tone.freq, t0)
    // Ramp from silence and back to silence so there is never a click or pop.
    gain.gain.setValueAtTime(FLOOR, t0)
    gain.gain.exponentialRampToValueAtTime(tone.peak * UI_SCALE, t0 + ATTACK)
    gain.gain.exponentialRampToValueAtTime(FLOOR, t0 + tone.length)
    osc.connect(gain)
    gain.connect(master)
    osc.start(t0)
    osc.stop(t0 + tone.length + 0.02)
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
  }

  function play(name: SoundName) {
    if (!ctx || !master || ctx.state === 'closed' || muted) return
    if (name === 'hover') {
      if (ctx.currentTime - lastHover < HOVER_THROTTLE) return
      lastHover = ctx.currentTime
    }
    for (const tone of RECIPES[name]) blip(tone)
  }

  function motion(level: number, place?: SoundPlace) {
    if (!ctx || !master || ctx.state === 'closed' || muted) return
    if (!sand && !(level > 0)) return
    if (!sand) {
      space = createSandSpace(ctx, master)
      sand = createSand(ctx, space.input)
    }
    // Starting from silence: put the sound where the motion is at once, so it does not swoop there.
    if (place) space?.setPlace(place, sand.level() === 0)
    sand.setLevel(level)
  }

  function close() {
    const c = ctx
    clearSuspendTimer()
    sand?.dispose()
    sand = null
    space?.dispose()
    space = null
    ambient?.dispose()
    ambient = null
    ctx = null
    master = null
    if (c && c.state !== 'closed') void Promise.resolve(c.close?.()).catch(() => {})
  }

  return {
    unlock,
    whenRunning: () => running,
    play,
    ready: () => ctx !== null,
    startScore,
    stopScore,
    scoreActive: () => !muted && ambient !== null && ambient.running(),
    motion,
    close,
  }
}

/**
 * Saved choice. Sound is on unless the visitor switched it off. Never throws
 * (private mode / blocked storage fall back to the default, "on").
 */
export function readSoundPreference(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function writeSoundPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // Ignore: the choice just will not be remembered.
  }
}
