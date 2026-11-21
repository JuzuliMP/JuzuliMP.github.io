// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOADER_MAX_MS, LOADER_MIN_MS, Loader } from '../../app/components/home/Loader'
import {
  LOADER_ELEMENT_ID,
  LOADER_FAILSAFE_ATTR,
  LOADER_FAILSAFE_MS,
  LOADER_REVEAL_SCRIPT,
  LOADER_STORAGE_KEY,
  completeLoadTask,
  hasSeenLoader,
  isLoaderDone,
  resetLoaderGate,
  shouldShowLoader,
} from '../../app/components/home/loaderGate'
import { home } from '../../app/content/home'
import { stubBrowser } from './setup'

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const value = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))

beforeEach(() => {
  vi.useFakeTimers()
  resetLoaderGate()
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Loader', () => {
  it('shows a progress bar, counts up to 100 after the work is done, then fades out and unmounts', () => {
    stubBrowser()
    render(<Loader content={home.loader} />)

    const bar = screen.getByRole('progressbar', { name: home.loader.label })
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
    expect(screen.getByText(home.loader.title)).toBeTruthy()
    expect(document.getElementById(LOADER_ELEMENT_ID)!.hidden).toBe(false)

    // The scene reports the chunk and the first frame (fonts resolve on their own in jsdom).
    act(() => {
      completeLoadTask('scene')
      completeLoadTask('frame')
    })
    advance(300)
    const early = value()
    expect(early).toBeGreaterThan(0)
    expect(early).toBeLessThan(100)

    // Never 100 before the minimum time.
    advance(LOADER_MIN_MS - 300 - 60)
    expect(value()).toBeLessThan(100)

    advance(400)
    expect(value()).toBe(100)
    expect(document.getElementById(LOADER_ELEMENT_ID)!.getAttribute('data-phase')).toBe('leaving')
    expect(isLoaderDone()).toBe(true)
    expect(window.sessionStorage.getItem(LOADER_STORAGE_KEY)).toBe('1')

    // Fade, then gone from the DOM so it cannot trap focus or block clicks.
    advance(600)
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('stays visible for at least 800ms even when everything is ready at once', () => {
    stubBrowser()
    render(<Loader content={home.loader} />)
    act(() => {
      completeLoadTask('scene')
      completeLoadTask('frame')
    })
    advance(LOADER_MIN_MS - 100)
    expect(document.getElementById(LOADER_ELEMENT_ID)!.getAttribute('data-phase')).toBe('running')
    expect(value()).toBeLessThan(100)
    advance(1500)
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
  })

  it('never takes much more than 3 seconds, even if the scene never reports', () => {
    stubBrowser()
    render(<Loader content={home.loader} />)
    advance(LOADER_MAX_MS - 100)
    expect(document.getElementById(LOADER_ELEMENT_ID)).not.toBeNull()
    advance(100 + 600)
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
    expect(isLoaderDone()).toBe(true)
  })

  it('is skipped when it already played in this tab session', () => {
    stubBrowser()
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
    render(<Loader content={home.loader} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
    expect(isLoaderDone()).toBe(true) // the hero does not wait
  })

  it('does not show when sessionStorage is blocked (cannot remember, so never replays)', () => {
    stubBrowser()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(hasSeenLoader()).toBe(true)
    expect(shouldShowLoader()).toBe(false)
    render(<Loader content={home.loader} />)
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
  })

  it('with reduced motion skips the count and just fades quickly', () => {
    stubBrowser({ reducedMotion: true })
    render(<Loader content={home.loader} />)
    advance(40)
    expect(value()).toBe(100) // no counting animation
    act(() => {
      completeLoadTask('scene')
      completeLoadTask('frame')
    })
    advance(400)
    expect(document.getElementById(LOADER_ELEMENT_ID)!.getAttribute('data-phase')).toBe('leaving')
    advance(200)
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
  })

  it('stops counting when unmounted early and does not mark itself as played', () => {
    stubBrowser()
    const { unmount } = render(<Loader content={home.loader} />)
    unmount()
    advance(5000)
    expect(isLoaderDone()).toBe(false)
    expect(window.sessionStorage.getItem(LOADER_STORAGE_KEY)).toBeNull()
  })
})

describe('inline reveal script', () => {
  function shell(): HTMLElement {
    document.body.innerHTML = `<div id="${LOADER_ELEMENT_ID}" hidden></div>`
    return document.getElementById(LOADER_ELEMENT_ID)!
  }
  const run = () => new Function(LOADER_REVEAL_SCRIPT)()

  it('unhides the loader on a first visit', () => {
    const el = shell()
    run()
    expect(el.hidden).toBe(false)
  })

  it('keeps it hidden on a return visit', () => {
    const el = shell()
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
    run()
    expect(el.hidden).toBe(true)
  })

  it('keeps it hidden and does not throw when storage is blocked', () => {
    const el = shell()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(run).not.toThrow()
    expect(el.hidden).toBe(true)
  })
})

describe('loader failsafe (app bundle never runs)', () => {
  /** The prerendered shell as the server sends it: hidden, phase "boot". */
  const shell = () => {
    document.body.innerHTML = `<div id="${LOADER_ELEMENT_ID}" data-phase="boot" hidden></div>`
    return document.getElementById(LOADER_ELEMENT_ID)!
  }
  const runRevealScript = () => new Function(LOADER_REVEAL_SCRIPT)()

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the shell on a first visit, then hides and marks it if the app never mounts', () => {
    const el = shell()
    runRevealScript()
    expect(el.hidden).toBe(false)

    vi.advanceTimersByTime(LOADER_FAILSAFE_MS - 1)
    expect(el.hidden).toBe(false)
    vi.advanceTimersByTime(1)
    expect(el.hidden).toBe(true)
    expect(el.hasAttribute(LOADER_FAILSAFE_ATTR)).toBe(true)
  })

  it('leaves the loader alone once the app has taken it over', () => {
    const el = shell()
    runRevealScript()
    el.setAttribute('data-phase', 'running') // React mounted
    vi.advanceTimersByTime(LOADER_FAILSAFE_MS + 100)
    expect(el.hidden).toBe(false)
    expect(el.hasAttribute(LOADER_FAILSAFE_ATTR)).toBe(false)
  })

  it('never shows the shell on a return visit', () => {
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
    const el = shell()
    runRevealScript()
    vi.advanceTimersByTime(LOADER_FAILSAFE_MS + 100)
    expect(el.hidden).toBe(true)
    expect(el.hasAttribute(LOADER_FAILSAFE_ATTR)).toBe(false)
  })

  it('skips the loader when the app mounts after the failsafe fired', () => {
    stubBrowser()
    const el = shell()
    runRevealScript()
    vi.advanceTimersByTime(LOADER_FAILSAFE_MS)
    expect(el.hasAttribute(LOADER_FAILSAFE_ATTR)).toBe(true)
    document.body.innerHTML = el.outerHTML // keep the marked shell for the mount check

    const { container } = render(<Loader content={home.loader} />)
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(isLoaderDone()).toBe(true)
    expect(hasSeenLoader()).toBe(true)
  })
})
