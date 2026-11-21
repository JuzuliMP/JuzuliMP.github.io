/**
 * Places the sand sound (`sand.ts`) around the listener, following where the
 * particles move (see `motionSpace.ts` in the particle folder). Synthesised,
 * no audio files. Plain stereo, so it works on speakers and headphones alike.
 *
 *   input (stereo sand)
 *     -> width      a stereo-width matrix: wide for the spread-out field,
 *                   narrow for a compact icon or a pointer stir
 *     -> pan        left / right, never fully hard to one side
 *     -> height     a gentle high shelf: brighter reads as higher
 *     -> distance   treble roll-off and a lower level when far away
 *     -> out (dry)
 *   plus, from after the distance filter:
 *     -> reflection a short, darker echo from the opposite side (the room)
 *     -> reverb     a short stereo reverb of its own; more when far away
 *
 * Every setting glides, so moving the sound never clicks. `spaceParams` is
 * pure so it can be unit-tested.
 */
import { createRng, fillImpulse } from './ambientScore'

/** Where the sound is. All values are unitless and clamped. */
export type SoundPlace = {
  /** Left (-1) to right (1). */
  pan: number
  /** Low (-1) to high (1). */
  height: number
  /** Narrow (0, a point) to wide (1, the full stereo spread). */
  width: number
  /** Close (0) to far (1). */
  distance: number
}

/** How far the sound may pan to one side (1 would be fully hard left / right). */
export const PAN_RANGE = 0.7
/** High-shelf boost (dB) at the top of the screen; the same cut at the bottom. */
export const HEIGHT_DB = 4
export const HEIGHT_SHELF_HZ = 6000
/** Low-pass cut-off when close and when far (Hz): far sounds lose their treble. */
export const NEAR_LOWPASS_HZ = 16000
export const FAR_LOWPASS_HZ = 4000
/** How much quieter the dry sound gets when far (fraction of its level). */
export const FAR_DRY_DROP = 0.4
/** Reverb send when close and when far. */
export const REVERB_NEAR = 0.12
export const REVERB_FAR = 0.45
/** The opposite-side reflection: delay, tone and level when close and when far. */
export const REFLECTION_S = 0.017
export const REFLECTION_LOWPASS_HZ = 3500
export const REFLECTION_NEAR = 0.18
export const REFLECTION_FAR = 0.3
/** How far round the reflection sits on the other side (fraction of the dry pan). */
export const REFLECTION_SPREAD = 0.8
/** Length of the sand's own reverb (seconds): short, open air rather than a hall. */
export const SPACE_REVERB_SECONDS = 1.2
/** How quickly the sound follows a new place (seconds, time constant). */
export const PLACE_TAU = 0.12
const SPACE_SEED = 0x5a4d

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0)

export type SpaceParams = {
  pan: number
  /** Width matrix: each side keeps `direct` of itself and takes `cross` of the other side. */
  direct: number
  cross: number
  shelfDb: number
  lowpass: number
  dry: number
  reflectionPan: number
  reflection: number
  reverb: number
  /** Level trim for the pan (already applied to dry, reflection and reverb). */
  trim: number
}

/**
 * Width matrix gains for width `w` (0..1). At 1 the stereo passes as it is; at
 * 0 both sides get the same mono mix. Scaled so the level does not drop as the
 * sound narrows (the sand's two sides are mostly uncorrelated).
 */
export function widthGains(w: number): { direct: number; cross: number } {
  const width = clamp(w, 0, 1)
  const a = (1 + width) / 2
  const b = (1 - width) / 2
  const keep = 1 / Math.sqrt(a * a + b * b)
  return { direct: a * keep, cross: b * keep }
}

/**
 * Level trim that keeps a panned sound as loud as a centred one. The stereo
 * panner folds one side into the other; once the width matrix has made the
 * two sides partly alike (correlation 2 x direct x cross), they add up louder.
 */
export function panTrim(pan: number, direct: number, cross: number): number {
  const fold = Math.sin((Math.min(1, Math.abs(clamp(pan, -1, 1))) * Math.PI) / 2)
  return 1 / Math.sqrt(1 + 2 * direct * cross * fold)
}

/** Node settings for a place. */
export function spaceParams(place: SoundPlace): SpaceParams {
  const pan = clamp(place.pan, -1, 1) * PAN_RANGE
  const distance = clamp(place.distance, 0, 1)
  const { direct, cross } = widthGains(place.width)
  const trim = panTrim(pan, direct, cross)
  return {
    pan,
    direct,
    cross,
    shelfDb: clamp(place.height, -1, 1) * HEIGHT_DB,
    lowpass: NEAR_LOWPASS_HZ * (FAR_LOWPASS_HZ / NEAR_LOWPASS_HZ) ** distance,
    dry: (1 - FAR_DRY_DROP * distance) * trim,
    reflectionPan: -pan * REFLECTION_SPREAD,
    reflection: (REFLECTION_NEAR + (REFLECTION_FAR - REFLECTION_NEAR) * distance) * trim,
    reverb: (REVERB_NEAR + (REVERB_FAR - REVERB_NEAR) * distance) * trim,
    trim,
  }
}

export type SandSpace = {
  /** Connect the sand here. */
  input: AudioNode
  /** Moves the sound to a place. `jump` moves it at once (use when the sound starts from silence). */
  setPlace: (place: SoundPlace, jump?: boolean) => void
  dispose: () => void
}

/** Builds the space stage into `out` (the master), with the sound in the middle. */
export function createSandSpace(ctx: AudioContext, out: AudioNode): SandSpace {
  const nodes: AudioNode[] = []
  const keep = <T extends AudioNode>(n: T): T => {
    nodes.push(n)
    return n
  }
  const start = spaceParams({ pan: 0, height: 0, width: 0.5, distance: 0 })

  const input = keep(ctx.createGain())

  // Width: split, cross-mix with four gains, merge.
  let widthOut: AudioNode = input
  let widthGainsNodes: { ll: GainNode; rr: GainNode; lr: GainNode; rl: GainNode } | null = null
  if (typeof ctx.createChannelSplitter === 'function' && typeof ctx.createChannelMerger === 'function') {
    const split = keep(ctx.createChannelSplitter(2))
    const merge = keep(ctx.createChannelMerger(2))
    const gain = (v: number) => {
      const g = keep(ctx.createGain())
      g.gain.value = v
      return g
    }
    const ll = gain(start.direct)
    const rr = gain(start.direct)
    const lr = gain(start.cross) // left into right
    const rl = gain(start.cross) // right into left
    input.connect(split)
    split.connect(ll, 0)
    split.connect(rl, 1)
    split.connect(rr, 1)
    split.connect(lr, 0)
    ll.connect(merge, 0, 0)
    rl.connect(merge, 0, 0)
    rr.connect(merge, 0, 1)
    lr.connect(merge, 0, 1)
    widthOut = merge
    widthGainsNodes = { ll, rr, lr, rl }
  }

  const panner = typeof ctx.createStereoPanner === 'function' ? keep(ctx.createStereoPanner()) : null
  const shelf = keep(ctx.createBiquadFilter())
  shelf.type = 'highshelf'
  shelf.frequency.value = HEIGHT_SHELF_HZ
  shelf.gain.value = start.shelfDb
  const lowpass = keep(ctx.createBiquadFilter())
  lowpass.type = 'lowpass'
  lowpass.frequency.value = start.lowpass
  lowpass.Q.value = 0.5
  const dry = keep(ctx.createGain())
  dry.gain.value = start.dry

  if (panner) {
    widthOut.connect(panner)
    panner.connect(shelf)
  } else {
    widthOut.connect(shelf)
  }
  shelf.connect(lowpass)
  lowpass.connect(dry)
  dry.connect(out)

  // Reflection: a short, darker echo from the opposite side.
  const reflSend = keep(ctx.createGain())
  reflSend.gain.value = start.reflection
  const reflDelay = keep(ctx.createDelay(0.1))
  reflDelay.delayTime.value = REFLECTION_S
  const reflTone = keep(ctx.createBiquadFilter())
  reflTone.type = 'lowpass'
  reflTone.frequency.value = REFLECTION_LOWPASS_HZ
  const reflPan = typeof ctx.createStereoPanner === 'function' ? keep(ctx.createStereoPanner()) : null
  lowpass.connect(reflSend)
  reflSend.connect(reflDelay)
  reflDelay.connect(reflTone)
  if (reflPan) {
    reflPan.pan.value = start.reflectionPan
    reflTone.connect(reflPan)
    reflPan.connect(out)
  } else {
    reflTone.connect(out)
  }

  // Reverb: a short stereo noise-decay of its own.
  const rate = ctx.sampleRate || 44100
  const impulse = ctx.createBuffer(2, Math.max(1, Math.floor(SPACE_REVERB_SECONDS * rate)), rate)
  const rng = createRng(SPACE_SEED)
  for (let c = 0; c < 2; c++) fillImpulse(impulse.getChannelData(c), rate, rng, SPACE_REVERB_SECONDS, 3.2)
  const reverbSend = keep(ctx.createGain())
  reverbSend.gain.value = start.reverb
  const convolver = keep(ctx.createConvolver())
  convolver.buffer = impulse
  lowpass.connect(reverbSend)
  reverbSend.connect(convolver)
  convolver.connect(out)

  let disposed = false
  return {
    input,
    setPlace(place, jump = false) {
      if (disposed) return
      const p = spaceParams(place)
      const t = ctx.currentTime
      const tau = jump ? 0.005 : PLACE_TAU
      if (widthGainsNodes) {
        widthGainsNodes.ll.gain.setTargetAtTime(p.direct, t, tau)
        widthGainsNodes.rr.gain.setTargetAtTime(p.direct, t, tau)
        widthGainsNodes.lr.gain.setTargetAtTime(p.cross, t, tau)
        widthGainsNodes.rl.gain.setTargetAtTime(p.cross, t, tau)
      }
      panner?.pan.setTargetAtTime(p.pan, t, tau)
      shelf.gain.setTargetAtTime(p.shelfDb, t, tau)
      lowpass.frequency.setTargetAtTime(p.lowpass, t, tau)
      dry.gain.setTargetAtTime(p.dry, t, tau)
      reflPan?.pan.setTargetAtTime(p.reflectionPan, t, tau)
      reflSend.gain.setTargetAtTime(p.reflection, t, tau)
      reverbSend.gain.setTargetAtTime(p.reverb, t, tau)
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const n of nodes) {
        try {
          n.disconnect()
        } catch {
          // Already disconnected.
        }
      }
    },
  }
}
