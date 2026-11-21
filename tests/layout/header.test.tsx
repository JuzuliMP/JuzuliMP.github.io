// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { SiteHeader } from '../../app/components/layout/SiteHeader'
import { SoundProvider } from '../../app/components/layout/SoundProvider'

type Frame = (time: number) => void
let frames: Frame[] = []
let media: (query: string) => boolean = () => false
let clock = 1000

/** Runs every queued animation frame once (frames queued while running wait for the next flush). */
function flushFrames(times = 1) {
  for (let i = 0; i < times; i++) {
    const queue = frames
    frames = []
    clock += 16
    act(() => {
      queue.forEach((cb) => cb(clock))
    })
  }
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  flushFrames()
}

beforeEach(() => {
  frames = []
  media = () => false
  clock = 1000
  window.localStorage.clear() // the sound choice is remembered between renders
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
  vi.stubGlobal('requestAnimationFrame', (cb: Frame) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  window.matchMedia = ((query: string) => ({
    matches: media(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const headerEl = () => document.querySelector('[data-header]') as HTMLElement
const isHidden = () => headerEl().hasAttribute('data-hidden')
const barEl = () => document.querySelector('[data-header-bar]') as HTMLElement

function renderHeader(active: 'home' | 'about' | 'work' | null = 'home') {
  return render(
    <SoundProvider>
      <SiteHeader active={active} />
    </SoundProvider>,
  )
}

describe('SiteHeader desktop navigation', () => {
  it('marks only the active item with aria-current="page"', () => {
    renderHeader('work')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const current = within(nav).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0].getAttribute('href')).toBe('/work/')
    expect(current[0].textContent).toContain('Selected apps')
  })

  it('has no current item when no page is active', () => {
    renderHeader(null)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getAllByRole('link').some((a) => a.hasAttribute('aria-current'))).toBe(false)
  })

  it('links the name to home and Let\'s talk to mailto', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /Mohammed Juzuli/ }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: "Let's talk" }).getAttribute('href')).toBe(
      'mailto:juzulitry@gmail.com',
    )
  })
})

describe('SiteHeader mobile menu', () => {
  it('starts closed with aria-expanded=false', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.getAttribute('aria-controls')).toBe('mobile-menu')
    expect(document.getElementById('mobile-menu')).toBeNull()
  })

  it('opens the sheet from Menu and closes it with the Close button', () => {
    renderHeader('about')
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    const sheet = document.getElementById('mobile-menu')!
    expect(sheet).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Close' }).getAttribute('aria-expanded')).toBe('true')
    expect(within(sheet).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/', '/about/', '/work/', 'mailto:juzulitry@gmail.com']),
    )
    expect(within(sheet).getByRole('navigation', { name: 'Social links' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(document.getElementById('mobile-menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded')).toBe('false')
  })

  it('closes on Escape and restores focus to the Menu button', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(document.getElementById('mobile-menu')).not.toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.getElementById('mobile-menu')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }))
  })

  it('locks page scroll while open and releases it on close', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})

describe('sound toggle', () => {
  it('is on by default, in the header on every page, and toggles aria-pressed and its label', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Sound on' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.closest('header')).not.toBeNull()
    fireEvent.click(button)
    const off = screen.getByRole('button', { name: 'Sound off' })
    expect(off.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(off)
    expect(screen.getByRole('button', { name: 'Sound on' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('applies a stored "off" after mount', () => {
    window.localStorage.setItem('juzuli-sound', 'off')
    renderHeader()
    expect(screen.getByRole('button', { name: 'Sound off' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('is a real button, reachable by keyboard, and activates with Enter or Space semantics (click)', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Sound on' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.tabIndex).not.toBe(-1)
    act(() => button.focus())
    expect(document.activeElement).toBe(button)
  })

  it('shares state between the desktop toggle and the mobile sheet toggle', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    const toggles = screen.getAllByRole('button', { name: 'Sound on' })
    expect(toggles).toHaveLength(2)
    fireEvent.click(toggles[1])
    const off = screen.getAllByRole('button', { name: 'Sound off' })
    expect(off).toHaveLength(2)
    for (const b of off) expect(b.getAttribute('aria-pressed')).toBe('false')
  })

  it('shows decorative sound bars only while on, hidden from assistive tech', () => {
    renderHeader()
    const on = screen.getByRole('button', { name: 'Sound on' })
    const bars = on.querySelector('[data-sound-bars]')!
    expect(bars).not.toBeNull()
    expect(bars.getAttribute('aria-hidden')).toBe('true')
    expect(bars.children).toHaveLength(3)
    expect(bars.getAttribute('data-sound-bars')).toBe('idle') // nothing is playing before a gesture
    fireEvent.click(on)
    expect(screen.getByRole('button', { name: 'Sound off' }).querySelector('[data-sound-bars]')).toBeNull()
  })
})

describe('sound bars animation', () => {
  class FakeContext {
    state = 'running'
    currentTime = 0
    sampleRate = 8000
    destination = {}
    resume = async () => {}
    suspend = async () => {}
    close = async () => {}
    private node = () => ({
      connect: () => {},
      disconnect: () => {},
      gain: param(),
      frequency: param(),
      detune: param(),
      Q: param(),
      delayTime: param(),
      threshold: param(),
      knee: param(),
      ratio: param(),
      attack: param(),
      release: param(),
      pan: param(),
      start: () => {},
      stop: () => {},
    })
    createGain = this.node
    createOscillator = this.node
    createBiquadFilter = this.node
    createConvolver = this.node
    createDelay = this.node
    createDynamicsCompressor = this.node
    createStereoPanner = this.node
    createBuffer = (c: number, len: number) => ({ getChannelData: () => new Float32Array(len), numberOfChannels: c })
  }
  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
    setTargetAtTime: () => {},
    cancelScheduledValues: () => {},
  })

  let animate: ReturnType<typeof vi.fn>
  let cancel: ReturnType<typeof vi.fn>
  beforeEach(() => {
    cancel = vi.fn()
    animate = vi.fn(() => ({ cancel }))
    ;(HTMLElement.prototype as unknown as { animate: unknown }).animate = animate
    ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeContext
  })
  afterEach(() => {
    delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
  })

  const start = async () => {
    renderHeader()
    await act(async () => {
      window.dispatchEvent(new Event('pointerdown'))
    })
  }

  it('moves the three bars while the score plays, and stops when sound is switched off', async () => {
    await start()
    expect(document.querySelector('[data-sound-bars]')!.getAttribute('data-sound-bars')).toBe('playing')
    expect(animate).toHaveBeenCalledTimes(3)
    fireEvent.click(screen.getByRole('button', { name: 'Sound on' }))
    expect(cancel).toHaveBeenCalledTimes(3)
    expect(document.querySelector('[data-sound-bars]')).toBeNull()
  })

  it('keeps the bars static under reduced motion', async () => {
    media = (q) => q.includes('prefers-reduced-motion')
    await start()
    expect(document.querySelector('[data-sound-bars]')!.getAttribute('data-sound-bars')).toBe('playing')
    expect(animate).not.toHaveBeenCalled()
  })
})

describe('header hide on scroll', () => {
  it('is visible at the top and hides when scrolling down past the threshold', () => {
    renderHeader()
    expect(isHidden()).toBe(false)
    scrollTo(40)
    expect(isHidden()).toBe(false)
    scrollTo(200)
    expect(isHidden()).toBe(true)
    expect(barEl().className).toContain('-translate-y-full')
  })

  it('comes back on any scroll up', () => {
    renderHeader()
    scrollTo(400)
    expect(isHidden()).toBe(true)
    scrollTo(380)
    expect(isHidden()).toBe(false)
    expect(barEl().className).toContain('translate-y-0')
    scrollTo(600)
    expect(isHidden()).toBe(true)
    scrollTo(0)
    expect(isHidden()).toBe(false)
  })

  it('gets a solid, blurred background once scrolled, and none at the top', () => {
    renderHeader()
    expect(barEl().className).not.toContain('bg-ink/80')
    scrollTo(120)
    expect(barEl().className).toContain('bg-ink/80')
    expect(barEl().className).toContain('backdrop-blur')
    scrollTo(0)
    expect(barEl().className).not.toContain('bg-ink/80')
  })

  it('stays visible while the mobile menu is open', () => {
    renderHeader()
    scrollTo(500)
    expect(isHidden()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(isHidden()).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(isHidden()).toBe(true)
  })

  it('stays visible while keyboard focus is inside it, and hides again when focus leaves', () => {
    renderHeader()
    scrollTo(500)
    expect(isHidden()).toBe(true)
    fireEvent.keyDown(document, { key: 'Tab' })
    const link = screen.getByRole('link', { name: /Mohammed Juzuli/ })
    act(() => link.focus())
    expect(isHidden()).toBe(false)
    act(() => link.blur())
    expect(isHidden()).toBe(true)
  })

  it('is not pinned open by mouse focus', () => {
    renderHeader()
    scrollTo(500)
    fireEvent.pointerDown(document.body)
    act(() => screen.getByRole('button', { name: 'Sound on' }).focus())
    expect(isHidden()).toBe(true)
  })

  it('never hides with reduced motion', () => {
    media = (q) => q.includes('prefers-reduced-motion')
    renderHeader()
    scrollTo(500)
    expect(isHidden()).toBe(false)
    expect(barEl().className).toContain('bg-ink/80')
  })
})

describe("magnetic Let's talk pill", () => {
  const pill = () => screen.getByRole('link', { name: "Let's talk" }).parentElement as HTMLElement
  const movePointer = (x: number, y: number) => {
    act(() => {
      const e = new Event('pointermove') as Event & { clientX: number; clientY: number; pointerType: string }
      e.clientX = x
      e.clientY = y
      e.pointerType = 'mouse'
      window.dispatchEvent(e)
    })
    flushFrames(90)
  }

  it('moves toward the pointer within ~80px with a fine pointer', () => {
    media = (q) => q.includes('hover: hover') && q.includes('pointer: fine')
    renderHeader()
    // jsdom lays everything out at 0,0 with no size, so the pill's box is the origin.
    movePointer(40, 20)
    expect(pill().style.transform).toMatch(/translate3d\(/)
    movePointer(400, 400)
    expect(pill().style.transform).toBe('')
  })

  it('does nothing when the pointer is not fine (touch)', () => {
    media = () => false
    renderHeader()
    movePointer(40, 20)
    expect(pill().style.transform).toBe('')
  })

  it('does nothing under reduced motion', () => {
    media = (q) => q.includes('prefers-reduced-motion') || (q.includes('hover: hover') && q.includes('pointer: fine'))
    renderHeader()
    movePointer(40, 20)
    expect(pill().style.transform).toBe('')
  })

  it('stays a real mailto link', () => {
    media = () => true
    renderHeader()
    expect(screen.getByRole('link', { name: "Let's talk" }).getAttribute('href')).toBe('mailto:juzulitry@gmail.com')
  })
})
