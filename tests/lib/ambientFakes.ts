import { vi } from 'vitest'

/** Minimal Web Audio stand-ins that record what the code under test does. */

export class FakeParam {
  value: number
  calls: Array<{ method: string; args: number[] }> = []
  constructor(value = 0) {
    this.value = value
  }
  private log(method: string, args: number[]) {
    this.calls.push({ method, args })
    return this
  }
  setValueAtTime(v: number, t: number) {
    return this.log('setValueAtTime', [v, t])
  }
  linearRampToValueAtTime(v: number, t: number) {
    return this.log('linearRampToValueAtTime', [v, t])
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    return this.log('exponentialRampToValueAtTime', [v, t])
  }
  setTargetAtTime(v: number, t: number, c: number) {
    return this.log('setTargetAtTime', [v, t, c])
  }
  cancelScheduledValues(t: number) {
    return this.log('cancelScheduledValues', [t])
  }
  last(method: string) {
    return [...this.calls].reverse().find((c) => c.method === method)
  }
}

export class FakeNode {
  outputs: unknown[] = []
  /** Every connection with its output / input channel indices (for splitters and mergers). */
  routes: Array<{ target: unknown; output: number; input: number }> = []
  disconnected = false
  connect = vi.fn((target: unknown, output = 0, input = 0) => {
    this.outputs.push(target)
    this.routes.push({ target, output, input })
    return target
  })
  disconnect = vi.fn(() => {
    this.disconnected = true
  })
}

export class FakeGain extends FakeNode {
  gain = new FakeParam(1)
}

export class FakeOscillator extends FakeNode {
  type = 'sine'
  frequency = new FakeParam(440)
  detune = new FakeParam(0)
  start = vi.fn()
  stop = vi.fn()
  onended: null | (() => void) = null
  /** Simulates the browser finishing playback. */
  finish() {
    this.onended?.()
  }
}

export class FakeFilter extends FakeNode {
  type = 'lowpass'
  frequency = new FakeParam(350)
  Q = new FakeParam(1)
  gain = new FakeParam(0)
}

export class FakeChannelNode extends FakeNode {
  constructor(readonly channels: number) {
    super()
  }
}

export class FakeConvolver extends FakeNode {
  buffer: unknown = null
}

export class FakeDelay extends FakeNode {
  delayTime = new FakeParam(0)
}

export class FakeCompressor extends FakeNode {
  threshold = new FakeParam(-24)
  knee = new FakeParam(30)
  ratio = new FakeParam(12)
  attack = new FakeParam(0.003)
  release = new FakeParam(0.25)
}

export class FakePanner extends FakeNode {
  pan = new FakeParam(0)
}

export class FakeBufferSource extends FakeNode {
  buffer: unknown = null
  loop = false
  playbackRate = new FakeParam(1)
  start = vi.fn()
  stop = vi.fn()
}

export class FakeContext {
  static instances: FakeContext[] = []
  state: 'running' | 'suspended' | 'closed' = 'suspended'
  currentTime = 0
  sampleRate = 8000
  destination = new FakeNode()
  gains: FakeGain[] = []
  oscillators: FakeOscillator[] = []
  filters: FakeFilter[] = []
  convolvers: FakeConvolver[] = []
  delays: FakeDelay[] = []
  compressors: FakeCompressor[] = []
  panners: FakePanner[] = []
  sources: FakeBufferSource[] = []
  splitters: FakeChannelNode[] = []
  mergers: FakeChannelNode[] = []
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  suspend = vi.fn(async () => {
    this.state = 'suspended'
  })
  close = vi.fn(async () => {
    this.state = 'closed'
  })
  constructor() {
    FakeContext.instances.push(this)
  }
  createGain() {
    const n = new FakeGain()
    this.gains.push(n)
    return n
  }
  createOscillator() {
    const n = new FakeOscillator()
    this.oscillators.push(n)
    return n
  }
  createBiquadFilter() {
    const n = new FakeFilter()
    this.filters.push(n)
    return n
  }
  createConvolver() {
    const n = new FakeConvolver()
    this.convolvers.push(n)
    return n
  }
  createDelay() {
    const n = new FakeDelay()
    this.delays.push(n)
    return n
  }
  createDynamicsCompressor() {
    const n = new FakeCompressor()
    this.compressors.push(n)
    return n
  }
  createStereoPanner() {
    const n = new FakePanner()
    this.panners.push(n)
    return n
  }
  createChannelSplitter(channels = 6) {
    const n = new FakeChannelNode(channels)
    this.splitters.push(n)
    return n
  }
  createChannelMerger(channels = 6) {
    const n = new FakeChannelNode(channels)
    this.mergers.push(n)
    return n
  }
  createBufferSource() {
    const n = new FakeBufferSource()
    this.sources.push(n)
    return n
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length))
    return { numberOfChannels: channels, length, sampleRate, getChannelData: (c: number) => data[c] }
  }
}

/** Oscillators that are still playing (started and not yet ended / disconnected). */
export const liveOscillators = (ctx: FakeContext) => ctx.oscillators.filter((o) => !o.disconnected)
