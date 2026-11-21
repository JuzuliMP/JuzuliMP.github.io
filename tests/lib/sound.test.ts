// @vitest-environment jsdom
import { createElement, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SoundProvider, useSound } from '../../app/components/layout/SoundProvider'
import { ArrowLink } from '../../app/components/ui/ArrowLink'
import { PillLink } from '../../app/components/ui/PillLink'
import { SCORE_GAIN } from '../../app/lib/ambient'
import {
  FADE_OUT_SECONDS,
  HOVER_THROTTLE,
  MASTER_GAIN,
  SOUND_STORAGE_KEY,
  UI_SCALE,
  createSoundEngine,
  readSoundPreference,
  writeSoundPreference,
} from '../../app/lib/sound'
import { FakeContext } from './ambientFakes'

// jsdom has no PointerEvent, so `pointerType` would be lost; a minimal stand-in carries it.
class FakePointerEvent extends MouseEvent {
  pointerType: string
  constructor(type: string, init: MouseEventInit & { pointerType?: string } = {}) {
    super(type, init)
    this.pointerType = init.pointerType ?? ''
  }
}

const setHidden = (hidden: boolean | null) => {
  if (hidden === null) {
    delete (document as unknown as { hidden?: boolean }).hidden
    return
  }
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
}

beforeEach(() => {
  vi.useFakeTimers()
  ;(window as unknown as { PointerEvent: unknown }).PointerEvent = FakePointerEvent
  FakeContext.instances = []
  window.localStorage.clear()
  ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeContext
})

afterEach(() => {
  cleanup()
  setHidden(null)
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete (window as unknown as { AudioContext?: unknown }).AudioContext
})

/** Lets the resume() promise chain settle. */
const flush = () => act(async () => {})
/** Moves timers forward (the suspend timer, the scheduler) inside act. */
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

/** The score's bus: the gain that feeds the master and fades up to SCORE_GAIN. */
const scoreBus = (ctx: FakeContext) =>
  ctx.gains.find((g) => g.outputs.includes(ctx.gains[0]) && g.gain.last('linearRampToValueAtTime')?.args[0] === SCORE_GAIN)!
const ctxOf = () => FakeContext.instances[0]
const oscillatorCount = () => FakeContext.instances.reduce((n, c) => n + c.oscillators.length, 0)

describe('sound engine', () => {
  it('creates no AudioContext until unlock() is called', () => {
    const engine = createSoundEngine()
    engine.play('click')
    engine.startScore()
    engine.stopScore()
    expect(FakeContext.instances).toHaveLength(0)
    expect(engine.ready()).toBe(false)
    expect(engine.unlock()).toBe(true)
    expect(FakeContext.instances).toHaveLength(1)
    expect(ctxOf().resume).toHaveBeenCalled()
    engine.unlock()
    expect(FakeContext.instances).toHaveLength(1)
  })

  it('reports false when Web Audio is not available', () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    const engine = createSoundEngine()
    expect(engine.unlock()).toBe(false)
    expect(() => {
      engine.play('toggle')
      engine.startScore()
      engine.stopScore()
    }).not.toThrow()
  })

  it('falls back to webkitAudioContext', () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    ;(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext = FakeContext
    expect(createSoundEngine().unlock()).toBe(true)
    delete (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
  })

  it('whenRunning() resolves true once the context is running', async () => {
    const engine = createSoundEngine()
    expect(await engine.whenRunning()).toBe(false)
    engine.unlock()
    expect(await engine.whenRunning()).toBe(true)
  })

  it('whenRunning() resolves false when resume() is refused', async () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = ctxOf()
    ctx.state = 'suspended'
    ctx.resume.mockImplementation(async () => {})
    engine.unlock()
    expect(await engine.whenRunning()).toBe(false)
  })

  it('routes master gain -> safety compressor -> destination', () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = ctxOf()
    const master = ctx.gains[0]
    expect(master.gain.value).toBe(MASTER_GAIN)
    expect(ctx.compressors).toHaveLength(1)
    expect(master.outputs).toContain(ctx.compressors[0])
    expect(ctx.compressors[0].outputs).toContain(ctx.destination)
    expect(ctx.compressors[0].ratio.value).toBeGreaterThanOrEqual(10) // limiter-like
  })

  it('keeps UI sounds subtle (master x UI_SCALE = 0.12, ~6 dB up to sit over the score) and ramps each blip from and back to silence (no clicks)', () => {
    expect(MASTER_GAIN * UI_SCALE).toBeCloseTo(0.12, 9)
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = ctxOf()
    engine.play('click')
    expect(ctx.oscillators.length).toBeGreaterThan(0)
    const env = ctx.gains[1].gain
    expect(env.calls[0].args[0]).toBeLessThan(0.001)
    expect(env.last('exponentialRampToValueAtTime')!.args[0]).toBeLessThan(0.001)
    for (const o of ctx.oscillators) {
      expect(o.start).toHaveBeenCalled()
      expect(o.stop).toHaveBeenCalled()
    }
  })

  it('keeps the score a quiet background on the same master as the UI ticks', () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = ctxOf()
    engine.play('hover')
    const tickPeak = ctx.gains[1].gain.calls.filter((c) => c.method === 'exponentialRampToValueAtTime')[0].args[0]
    // A sustained pad sums several voices, so its bus sits above one tick's peak
    // (measured in Chrome: score ~-33 dBFS RMS, ticks -28 to -22 dBFS peak) but
    // never more than a couple of ticks' worth.
    expect(SCORE_GAIN).toBeGreaterThan(tickPeak)
    expect(SCORE_GAIN).toBeLessThan(tickPeak * 2.5)
    expect(MASTER_GAIN * UI_SCALE).toBeCloseTo(0.12, 5)
    engine.startScore()
    expect(scoreBus(ctx).gain.last('linearRampToValueAtTime')!.args[0]).toBe(SCORE_GAIN)
  })

  it('plays a two-note chime for "toggle"', () => {
    const engine = createSoundEngine()
    engine.unlock()
    engine.play('toggle')
    const ctx = ctxOf()
    expect(ctx.oscillators).toHaveLength(2)
    const [a, b] = ctx.oscillators.map((o) => o.frequency.calls[0].args[0])
    expect(b).toBeGreaterThan(a)
  })

  it('throttles hover ticks but not clicks', () => {
    const engine = createSoundEngine()
    engine.unlock()
    const ctx = ctxOf()
    engine.play('hover')
    engine.play('hover')
    expect(ctx.oscillators).toHaveLength(1)
    ctx.currentTime += HOVER_THROTTLE + 0.01
    engine.play('hover')
    expect(ctx.oscillators).toHaveLength(2)
    const before = ctx.oscillators.length
    engine.play('click')
    engine.play('click')
    expect(ctx.oscillators.length).toBeGreaterThan(before + 1)
  })

  it('plays nothing after close() and closes the context', () => {
    const engine = createSoundEngine()
    engine.unlock()
    engine.startScore()
    const ctx = ctxOf()
    engine.close()
    expect(ctx.close).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    const count = ctx.oscillators.length
    engine.play('click')
    expect(ctx.oscillators.length).toBe(count)
    expect(engine.ready()).toBe(false)
  })

  describe('background score', () => {
    it('starts the scheduler and the pad on startScore()', () => {
      const engine = createSoundEngine()
      engine.unlock()
      const ctx = ctxOf()
      expect(ctx.oscillators).toHaveLength(0)
      engine.startScore()
      expect(engine.scoreActive()).toBe(true)
      expect(ctx.oscillators.length).toBeGreaterThan(0)
      expect(vi.getTimerCount()).toBeGreaterThan(0) // the 200 ms look-ahead timer
      const n = ctx.oscillators.length
      engine.startScore() // idempotent
      expect(ctx.oscillators.length).toBe(n)
      engine.close()
    })

    it('stopScore() fades the master out within 300 ms, stops the scheduler, then suspends once silent', () => {
      const engine = createSoundEngine()
      engine.unlock()
      engine.startScore()
      const ctx = ctxOf()
      ctx.state = 'running'
      engine.stopScore()
      expect(engine.scoreActive()).toBe(false)
      const master = ctx.gains[0].gain
      const fade = master.last('linearRampToValueAtTime')!
      expect(fade.args[0]).toBe(0)
      expect(fade.args[1] - ctx.currentTime).toBeLessThanOrEqual(0.3)
      expect(FADE_OUT_SECONDS).toBeLessThanOrEqual(0.3)
      expect(ctx.suspend).not.toHaveBeenCalled() // not before the fade has finished
      const oscillators = ctx.oscillators.length
      vi.advanceTimersByTime(1000)
      expect(ctx.suspend).toHaveBeenCalledTimes(1)
      expect(ctx.oscillators.length).toBe(oscillators) // nothing scheduled while stopped
      expect(vi.getTimerCount()).toBe(0)
    })

    it('is silent while stopped, and startScore() resumes the context and brings the master back', () => {
      const engine = createSoundEngine()
      engine.unlock()
      engine.startScore()
      const ctx = ctxOf()
      ctx.state = 'running'
      engine.stopScore()
      vi.advanceTimersByTime(1000)
      expect(ctx.state).toBe('suspended')
      const n = ctx.oscillators.length
      engine.play('click')
      expect(ctx.oscillators.length).toBe(n)

      ctx.resume.mockClear()
      engine.startScore(0.8)
      expect(ctx.resume).toHaveBeenCalled()
      expect(ctx.gains[0].gain.last('linearRampToValueAtTime')!.args[0]).toBe(MASTER_GAIN)
      expect(engine.scoreActive()).toBe(true)
      expect(ctx.oscillators.length).toBeGreaterThan(n)
      engine.play('click')
      engine.close()
    })

    it('does not suspend if the score was started again before the fade finished', () => {
      const engine = createSoundEngine()
      engine.unlock()
      engine.startScore()
      const ctx = ctxOf()
      ctx.state = 'running'
      engine.stopScore()
      vi.advanceTimersByTime(100)
      engine.startScore(0.8)
      vi.advanceTimersByTime(1000)
      expect(ctx.suspend).not.toHaveBeenCalled()
      engine.close()
    })
  })
})

describe('sound preference storage', () => {
  it('is on by default and round-trips', () => {
    expect(readSoundPreference()).toBe(true)
    writeSoundPreference(false)
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('off')
    expect(readSoundPreference()).toBe(false)
    writeSoundPreference(true)
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on')
    expect(readSoundPreference()).toBe(true)
  })

  it('treats the old default key value "on" as on', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'on')
    expect(readSoundPreference()).toBe(true)
  })

  it('never throws when storage is blocked, and falls back to on', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readSoundPreference()).toBe(true)
    expect(() => writeSoundPreference(false)).not.toThrow()
  })
})

const renders: boolean[] = []

function Probe() {
  const { enabled, playing, toggle, play } = useSound()
  renders.push(enabled)
  return createElement(
    'div',
    null,
    createElement('button', { onClick: toggle }, enabled ? 'on' : 'off'),
    createElement('span', { 'data-testid': 'playing' }, playing ? 'playing' : 'idle'),
    createElement('button', { onClick: () => play('click') }, 'click'),
    createElement('button', { onClick: () => play('hover') }, 'hover'),
  )
}

const tree = () => createElement(SoundProvider, null, createElement(Probe))
const mount = () => render(tree())
const GESTURES = ['pointerdown', 'keydown', 'touchend'] as const
const gestureCalls = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.filter((c) => (GESTURES as readonly unknown[]).includes(c[0]))

describe('SoundProvider: default on and hydration', () => {
  beforeEach(() => {
    renders.length = 0
  })

  it('renders "on" on the server and on the first client render', () => {
    const html = renderToString(tree())
    expect(html).toContain('>on<')
    mount()
    expect(renders[0]).toBe(true)
    expect(screen.getByRole('button', { name: 'on' })).toBeTruthy()
  })

  it('applies a stored "off" after mount, not in the first render', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'off')
    mount()
    expect(renders[0]).toBe(true) // identical to the prerendered markup
    expect(renders.at(-1)).toBe(false)
    expect(screen.getByRole('button', { name: 'off' })).toBeTruthy()
  })

  it('hydrates server markup without a mismatch even when "off" is stored', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree())
    document.body.appendChild(container)
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'off')
    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, createElement(StrictMode, null, tree()))
    })
    expect(errors).not.toHaveBeenCalled()
    expect(container.querySelector('button')!.textContent).toBe('off')
    act(() => root.unmount())
    container.remove()
  })

  it('creates no AudioContext, scheduler or oscillator at load', () => {
    const interval = vi.spyOn(globalThis, 'setInterval')
    mount()
    expect(FakeContext.instances).toHaveLength(0)
    expect(interval).not.toHaveBeenCalled()
  })

  it('play() is a no-op until the first gesture has unlocked audio', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'click' }))
    fireEvent.click(screen.getByRole('button', { name: 'hover' }))
    expect(FakeContext.instances).toHaveLength(0)
    expect(oscillatorCount()).toBe(0)
  })
})

describe('SoundProvider: starting audio on the first gesture', () => {
  it.each(GESTURES)('creates and resumes the context on the first %s, and starts the score', async (type) => {
    mount()
    expect(FakeContext.instances).toHaveLength(0)
    act(() => {
      window.dispatchEvent(new Event(type))
    })
    expect(FakeContext.instances).toHaveLength(1)
    expect(ctxOf().resume).toHaveBeenCalled()
    await flush()
    expect(oscillatorCount()).toBeGreaterThan(0) // the pad
    expect(screen.getByTestId('playing').textContent).toBe('playing')
  })

  it('registers the three passive listeners once, and removes them after the first success', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    mount()
    expect(gestureCalls(add).map((c) => c[0]).sort()).toEqual([...GESTURES].sort())
    for (const call of gestureCalls(add)) expect(call[2]).toMatchObject({ passive: true })
    expect(gestureCalls(remove)).toHaveLength(0)

    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    await flush()
    expect(gestureCalls(remove).map((c) => c[0]).sort()).toEqual([...GESTURES].sort())

    // Afterwards the page's gestures no longer touch audio.
    const oscillators = oscillatorCount()
    act(() => {
      window.dispatchEvent(new Event('keydown'))
      window.dispatchEvent(new Event('touchend'))
    })
    expect(FakeContext.instances).toHaveLength(1)
    expect(ctxOf().resume).toHaveBeenCalledTimes(1)
    expect(oscillatorCount()).toBe(oscillators)
  })

  it('keeps listening if the browser did not actually start the context', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    mount()
    const original = FakeContext.prototype
    void original
    ;(window as unknown as { AudioContext: unknown }).AudioContext = class extends FakeContext {
      constructor() {
        super()
        this.resume = vi.fn(async () => {}) as typeof this.resume // never reaches "running"
      }
    }
    act(() => {
      window.dispatchEvent(new Event('touchend'))
    })
    await flush()
    expect(FakeContext.instances).toHaveLength(1)
    expect(gestureCalls(remove)).toHaveLength(0)
  })

  it('does nothing on gestures when sound was saved as off, and registers no listeners', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'off')
    const add = vi.spyOn(window, 'addEventListener')
    mount()
    expect(gestureCalls(add)).toHaveLength(0)
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    expect(FakeContext.instances).toHaveLength(0)
  })

  it('removes the listeners when unmounted before any gesture', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = mount()
    view.unmount()
    expect(gestureCalls(remove)).toHaveLength(GESTURES.length)
  })

  it('ticks and clicks work once audio is unlocked', async () => {
    mount()
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    await flush()
    const before = oscillatorCount()
    fireEvent.click(screen.getByRole('button', { name: 'click' }))
    expect(oscillatorCount()).toBeGreaterThan(before)
  })
})

describe('SoundProvider: toggling', () => {
  async function startedAndRunning() {
    mount()
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    await flush()
  }

  it('off: fades out within 300 ms, stops the scheduler, suspends, remembers, and stops UI sounds', async () => {
    await startedAndRunning()
    const ctx = ctxOf()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'on' }))
    expect(screen.getByRole('button', { name: 'off' })).toBeTruthy()
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('off')
    expect(screen.getByTestId('playing').textContent).toBe('idle')

    const fade = ctx.gains[0].gain.last('linearRampToValueAtTime')!
    expect(fade.args[0]).toBe(0)
    expect(fade.args[1] - ctx.currentTime).toBeLessThanOrEqual(0.3)

    const count = oscillatorCount()
    fireEvent.click(screen.getByRole('button', { name: 'click' }))
    expect(oscillatorCount()).toBe(count)

    await tick(1000)
    expect(ctx.suspend).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    expect(oscillatorCount()).toBe(count) // no scheduling while off
  })

  it('on again: resumes the same context, plays the chime and restarts the score', async () => {
    await startedAndRunning()
    const ctx = ctxOf()
    fireEvent.click(screen.getByRole('button', { name: 'on' }))
    await tick(1000)
    expect(ctx.state).toBe('suspended')
    const before = oscillatorCount()
    ctx.resume.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'off' }))
    expect(FakeContext.instances).toHaveLength(1)
    expect(ctx.resume).toHaveBeenCalled()
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on')
    expect(oscillatorCount()).toBeGreaterThan(before + 2) // chime (2) + pad
    expect(vi.getTimerCount()).toBeGreaterThan(0)
  })

  it('switching off before any gesture creates nothing; switching on is itself a gesture', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'on' }))
    expect(FakeContext.instances).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'off' }))
    expect(FakeContext.instances).toHaveLength(1)
    expect(oscillatorCount()).toBeGreaterThan(2)
  })

  it('a stored "off" can be switched on and stays on after', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'off')
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'off' }))
    expect(screen.getByRole('button', { name: 'on' })).toBeTruthy()
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on')
    expect(FakeContext.instances).toHaveLength(1)
  })
})

describe('SoundProvider: tab visibility', () => {
  const setVisibility = (hidden: boolean) => {
    setHidden(hidden)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  async function started() {
    mount()
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    await flush()
    return ctxOf()
  }

  it('hidden: fades out, stops the scheduler and suspends; visible: resumes with a short fade-in', async () => {
    const ctx = await started()
    setVisibility(true)
    expect(ctx.gains[0].gain.last('linearRampToValueAtTime')!.args[0]).toBe(0)
    await tick(1000)
    expect(ctx.suspend).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.getByTestId('playing').textContent).toBe('idle')
    // The preference is untouched by hiding the tab.
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBeNull()

    const before = oscillatorCount()
    ctx.resume.mockClear()
    setVisibility(false)
    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.gains[0].gain.last('linearRampToValueAtTime')!.args[0]).toBe(MASTER_GAIN)
    expect(oscillatorCount()).toBeGreaterThan(before)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    expect(screen.getByTestId('playing').textContent).toBe('playing')
    const ramp = scoreBus(ctx).gain.last('linearRampToValueAtTime')!
    expect(ramp.args[1] - ctx.currentTime).toBeLessThan(1.5) // shorter than the 3 s first fade-in
  })

  it('does not resume when sound was switched off while the tab was hidden', async () => {
    const ctx = await started()
    setVisibility(true)
    fireEvent.click(screen.getByRole('button', { name: 'on' }))
    await tick(1000)
    ctx.resume.mockClear()
    const before = oscillatorCount()
    setVisibility(false)
    expect(ctx.resume).not.toHaveBeenCalled()
    expect(oscillatorCount()).toBe(before)
  })

  it('does not start audio on becoming visible before any gesture', () => {
    mount()
    setVisibility(true)
    setVisibility(false)
    expect(FakeContext.instances).toHaveLength(0)
  })

  it('removes the visibility listener on unmount', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    mount().unmount()
    expect(remove.mock.calls.some((c) => c[0] === 'visibilitychange')).toBe(true)
  })
})

describe('sound wiring on links', () => {
  // jsdom cannot navigate; stop the link clicks from trying.
  beforeEach(() => document.addEventListener('click', stopNavigation))
  afterEach(() => document.removeEventListener('click', stopNavigation))
  const stopNavigation = (e: Event) => e.preventDefault()

  function mountLinks() {
    return render(
      createElement(
        SoundProvider,
        null,
        createElement(Probe),
        createElement(PillLink, { href: '/work/', children: 'Pill' }),
        createElement(ArrowLink, { href: '/about/', children: 'Arrow' }),
      ),
    )
  }

  it('plays nothing on hover or click before audio is unlocked', () => {
    mountLinks()
    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Pill' }), { pointerType: 'mouse' })
    fireEvent.click(screen.getByRole('link', { name: 'Arrow' }))
    expect(FakeContext.instances).toHaveLength(0)
  })

  it('plays nothing on hover or click while sound is switched off', () => {
    mountLinks()
    fireEvent.click(screen.getByRole('button', { name: 'on' }))
    const count = oscillatorCount()
    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Pill' }), { pointerType: 'mouse' })
    fireEvent.click(screen.getByRole('link', { name: 'Arrow' }))
    expect(oscillatorCount()).toBe(count)
  })

  it('ticks on mouse hover and clicks on press once audio is on, but not for touch hover', async () => {
    mountLinks()
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    await flush()
    const base = oscillatorCount()
    const pill = screen.getByRole('link', { name: 'Pill' })
    fireEvent.pointerEnter(pill, { pointerType: 'touch' })
    expect(oscillatorCount()).toBe(base)
    fireEvent.pointerEnter(pill, { pointerType: 'mouse' })
    expect(oscillatorCount()).toBe(base + 1)
    fireEvent.click(screen.getByRole('link', { name: 'Arrow' }))
    expect(oscillatorCount()).toBeGreaterThan(base + 1)
  })
})
