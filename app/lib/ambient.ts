/**
 * The background score, synthesised live with the Web Audio API (no audio
 * files). It is a quiet, slow, generative piece in A minor:
 *
 *   - a pad: each chord note is two slightly detuned oscillators (sine plus a
 *     softer triangle) into a low-pass filter whose cutoff drifts on a slow LFO;
 *   - a sub-quiet root drone that glides between chord roots;
 *   - sparse high "particle" plinks from a fixed scale through a feedback delay;
 *   - space: a ConvolverNode with a generated noise-decay impulse response.
 *
 * What plays and when is decided by the pure module `ambientScore.ts`; this
 * file only turns events into nodes. A look-ahead scheduler (a timer every
 * 200 ms, notes placed up to 0.7 s ahead of the audio clock) keeps timing
 * steady even if the main thread hiccups.
 *
 * `createAmbient` does nothing until `start()`; it never runs at import time.
 */
import {
  IMPULSE_SECONDS,
  LOOKAHEAD_S,
  MAX_PAD_VOICES,
  MAX_PLINK_VOICES,
  SCORE_SEED,
  TICK_MS,
  createRng,
  createTimeline,
  drainDue,
  fillImpulse,
  midiToFreq,
  takeVoices,
  voiceBudget,
  type Chord,
  type ScoreEvent,
  type Timeline,
} from './ambientScore'

/**
 * Linear gain of the score bus, before the master (see MASTER_GAIN in sound.ts).
 * The one knob for how loud the background score is: measured at about -33 dBFS
 * RMS through the master. Sustained pads sum several voices, so this sits above
 * a single UI tick's peak and still sounds well under the ticks.
 */
export const SCORE_GAIN = 0.11
/** Default fade-in when the score starts (seconds). */
export const SCORE_FADE_IN = 3
/** Fade-in when it resumes after the tab was hidden (seconds). */
export const SCORE_RESUME_FADE_IN = 0.8

const PAD_ATTACK = 3 // seconds to bloom
const PAD_RELEASE = 4 // seconds to fade after the chord's slot ends (overlaps the next chord's bloom)
const PLINK_RING = 3 // seconds a plink is kept alive
const DRONE_GAIN = 0.16
const REVERB_WET = 0.6
const DELAY_TIME = 0.43
const DELAY_FEEDBACK = 0.4

type Voice = {
  /** Audio time after which this voice no longer counts. */
  endsAt: number
  kind: 'pad' | 'plink'
}

/** A bundle of nodes that live and die together (one chord, or one plink). */
type Group = {
  oscillators: OscillatorNode[]
  nodes: AudioNode[]
  voices: Voice[]
  remaining: number
  disposed: boolean
}

export type Ambient = {
  /** Fades the bus in and starts the scheduler. No-op while already running. */
  start: (fadeIn?: number) => void
  /** Stops the scheduler now, fades the bus out, then silences every voice. */
  stop: (fadeOut: number) => void
  running: () => boolean
  /** Pad and plink voices still sounding (or ringing out) at the current audio time. */
  voices: () => number
  dispose: () => void
}

type Graph = {
  mix: GainNode
  bus: GainNode
  delaySend: GainNode
  nodes: AudioNode[]
}

export function createAmbient(ctx: AudioContext, out: AudioNode): Ambient {
  let graph: Graph | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let killTimer: ReturnType<typeof setTimeout> | null = null
  let timeline: Timeline | null = null
  let origin = 0
  let lastChord = 0 // chord index to resume from after a stop
  let runs = 0 // how many times it has been started; feeds the seed so a restart is not a replay
  let groups: Group[] = []
  let drone: { osc: OscillatorNode; gain: GainNode } | null = null

  function build(): Graph {
    const nodes: AudioNode[] = []
    const keep = <T extends AudioNode>(n: T): T => {
      nodes.push(n)
      return n
    }
    const mix = keep(ctx.createGain())
    const bus = keep(ctx.createGain())
    bus.gain.value = 0
    mix.connect(bus)

    // Space: generated noise-decay impulse response.
    const rate = ctx.sampleRate || 44100
    const impulse = ctx.createBuffer(2, Math.floor(IMPULSE_SECONDS * rate), rate)
    const rng = createRng(SCORE_SEED ^ 0x5eed)
    for (let c = 0; c < 2; c++) fillImpulse(impulse.getChannelData(c), rate, rng)
    const convolver = keep(ctx.createConvolver())
    convolver.buffer = impulse
    const wet = keep(ctx.createGain())
    wet.gain.value = REVERB_WET
    mix.connect(convolver)
    convolver.connect(wet)
    wet.connect(bus)

    // Plink echoes: a feedback delay with a darkening filter in the loop.
    const delaySend = keep(ctx.createGain())
    delaySend.gain.value = 0.5
    const delay = keep(ctx.createDelay(2))
    delay.delayTime.value = DELAY_TIME
    const tone = keep(ctx.createBiquadFilter())
    tone.type = 'lowpass'
    tone.frequency.value = 2400
    const feedback = keep(ctx.createGain())
    feedback.gain.value = DELAY_FEEDBACK
    const delayOut = keep(ctx.createGain())
    delayOut.gain.value = 0.55
    delaySend.connect(delay)
    delay.connect(tone)
    tone.connect(feedback)
    feedback.connect(delay)
    tone.connect(delayOut)
    delayOut.connect(mix)

    bus.connect(out)
    return { mix, bus, delaySend, nodes }
  }

  function disconnectAll(nodes: AudioNode[]) {
    for (const n of nodes) {
      try {
        n.disconnect()
      } catch {
        // Already disconnected.
      }
    }
  }

  function release(group: Group) {
    if (group.disposed) return
    group.disposed = true
    disconnectAll(group.nodes)
    groups = groups.filter((g) => g !== group)
  }

  /** Registers a group; it frees itself when its last oscillator ends. */
  function track(group: Group) {
    group.remaining = group.oscillators.length
    for (const osc of group.oscillators) {
      osc.onended = () => {
        group.remaining -= 1
        if (group.remaining <= 0) release(group)
      }
    }
    groups.push(group)
  }

  function activeCount(kind: Voice['kind'], now: number): number {
    let n = 0
    for (const g of groups) for (const v of g.voices) if (v.kind === kind && v.endsAt > now) n++
    return n
  }

  function playChord(chord: Chord, index: number, at: number, g: Graph) {
    lastChord = index
    const now = ctx.currentTime

    // Drone: one oscillator that glides to each new root.
    const rootFreq = midiToFreq(chord.root)
    if (!drone) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(rootFreq, at)
      gain.gain.value = DRONE_GAIN
      osc.connect(gain)
      gain.connect(g.mix)
      osc.start(at)
      drone = { osc, gain }
    } else {
      drone.osc.frequency.setTargetAtTime(rootFreq, at, 1.8)
    }

    // Pad.
    const notes = takeVoices(chord.pad, voiceBudget(activeCount('pad', now), MAX_PAD_VOICES))
    if (notes.length === 0) return
    const hold = chord.seconds
    const end = at + hold + PAD_RELEASE
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 0.5
    filter.frequency.value = 1000
    const lfo = ctx.createOscillator()
    const lfoDepth = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.045 + 0.011 * (index % 4) // one slow sweep every 15 to 22 s
    lfoDepth.gain.value = 380
    lfo.connect(lfoDepth)
    lfoDepth.connect(filter.frequency)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.setTargetAtTime(1, at, PAD_ATTACK / 3)
    env.gain.setTargetAtTime(0, at + hold, PAD_RELEASE / 3)
    filter.connect(env)
    env.connect(g.mix)

    const oscillators: OscillatorNode[] = [lfo]
    const nodes: AudioNode[] = [filter, lfo, lfoDepth, env]
    for (const note of notes) {
      const f = midiToFreq(note)
      for (const [type, detune, level] of [
        ['sine', -5, 0.085],
        ['triangle', 5, 0.035],
      ] as const) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(f, at)
        osc.detune.setValueAtTime(detune, at)
        gain.gain.value = level
        osc.connect(gain)
        gain.connect(filter)
        osc.start(at)
        osc.stop(end + 0.1)
        oscillators.push(osc)
        nodes.push(osc, gain)
      }
    }
    lfo.start(at)
    lfo.stop(end + 0.1)
    track({
      oscillators,
      nodes,
      voices: notes.map(() => ({ kind: 'pad' as const, endsAt: end })),
      remaining: 0,
      disposed: false,
    })
  }

  function playPlink(event: Extract<ScoreEvent, { kind: 'plink' }>, at: number, g: Graph) {
    const now = ctx.currentTime
    if (voiceBudget(activeCount('plink', now), MAX_PLINK_VOICES) <= 0) return
    const f = midiToFreq(event.midi)
    const peak = 0.2 * event.velocity
    const end = at + PLINK_RING

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(peak, at + 0.008)
    env.gain.setTargetAtTime(0, at + 0.008, 0.4)

    const body = ctx.createOscillator()
    body.type = 'sine'
    body.frequency.setValueAtTime(f, at)
    const shimmer = ctx.createOscillator()
    const shimmerGain = ctx.createGain()
    shimmer.type = 'triangle'
    shimmer.frequency.setValueAtTime(f, at)
    shimmer.detune.setValueAtTime(4, at)
    shimmerGain.gain.value = 0.3
    body.connect(env)
    shimmer.connect(shimmerGain)
    shimmerGain.connect(env)

    const nodes: AudioNode[] = [env, body, shimmer, shimmerGain]
    const pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null
    if (pan) {
      pan.pan.value = event.pan
      env.connect(pan)
      pan.connect(g.mix)
      pan.connect(g.delaySend)
      nodes.push(pan)
    } else {
      env.connect(g.mix)
      env.connect(g.delaySend)
    }
    body.start(at)
    shimmer.start(at)
    body.stop(end)
    shimmer.stop(end)
    track({
      oscillators: [body, shimmer],
      nodes,
      voices: [{ kind: 'plink', endsAt: end }],
      remaining: 0,
      disposed: false,
    })
  }

  function tick() {
    if (!graph || !timeline) return
    const now = ctx.currentTime
    for (const { event, at } of drainDue(timeline, origin, now, LOOKAHEAD_S)) {
      if (event.kind === 'chord') playChord(event.chord, event.index, at, graph)
      else playPlink(event, at, graph)
    }
  }

  function clearKillTimer() {
    if (killTimer !== null) {
      clearTimeout(killTimer)
      killTimer = null
    }
  }

  /** Stops every voice at once and frees its nodes. Only called once the bus is silent. */
  function silence() {
    for (const g of [...groups]) {
      for (const osc of g.oscillators) {
        try {
          osc.stop()
        } catch {
          // Not started, or already stopped.
        }
      }
      release(g)
    }
    if (drone) {
      try {
        drone.osc.stop()
      } catch {
        // Already stopped.
      }
      disconnectAll([drone.osc, drone.gain])
      drone = null
    }
  }

  function rampBus(target: number, seconds: number) {
    if (!graph) return
    const p = graph.bus.gain
    const now = ctx.currentTime
    p.cancelScheduledValues?.(now)
    p.setValueAtTime(p.value, now)
    p.linearRampToValueAtTime(target, now + seconds)
  }

  return {
    start(fadeIn = SCORE_FADE_IN) {
      if (timer !== null) return
      clearKillTimer()
      graph ??= build()
      silence() // leftovers from an interrupted stop, if any
      rampBus(SCORE_GAIN, fadeIn)
      timeline = createTimeline({ seed: SCORE_SEED + runs, startChord: lastChord })
      runs += 1
      origin = ctx.currentTime + 0.05
      timer = setInterval(tick, TICK_MS)
      tick()
    },

    stop(fadeOut) {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
      rampBus(0, fadeOut)
      clearKillTimer()
      killTimer = setTimeout(() => {
        killTimer = null
        silence()
      }, fadeOut * 1000 + 40)
    },

    running: () => timer !== null,

    voices: () => activeCount('pad', ctx.currentTime) + activeCount('plink', ctx.currentTime),

    dispose() {
      if (timer !== null) clearInterval(timer)
      timer = null
      clearKillTimer()
      silence()
      if (graph) disconnectAll(graph.nodes)
      graph = null
      timeline = null
    },
  }
}
