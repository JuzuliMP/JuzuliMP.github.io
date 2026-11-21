import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Node environment: there is no window, no document, no AudioContext and no localStorage.

describe('server side and import time', () => {
  it('has no browser globals in this environment', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof AudioContext).toBe('undefined')
  })

  it('importing the sound modules touches no browser API and starts nothing', async () => {
    const timers = [vi.spyOn(globalThis, 'setInterval'), vi.spyOn(globalThis, 'setTimeout')]
    await import('../../app/lib/ambientScore')
    await import('../../app/lib/ambient')
    await import('../../app/lib/sound')
    await import('../../app/components/layout/SoundProvider')
    await import('../../app/components/layout/SiteHeader')
    for (const t of timers) expect(t).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it('creating an engine and reading the preference on the server is safe and creates no context', async () => {
    const { createSoundEngine, readSoundPreference } = await import('../../app/lib/sound')
    const engine = createSoundEngine()
    expect(engine.unlock()).toBe(false)
    expect(() => {
      engine.play('click')
      engine.startScore()
      engine.stopScore()
      engine.close()
    }).not.toThrow()
    expect(readSoundPreference()).toBe(true) // storage is unavailable: default on
  })

  it('renders the header toggle as "Sound on" (aria-pressed=true) and the sound bars idle', async () => {
    const { SoundProvider } = await import('../../app/components/layout/SoundProvider')
    const { SiteHeader } = await import('../../app/components/layout/SiteHeader')
    const html = renderToString(createElement(SoundProvider, null, createElement(SiteHeader, { active: 'home' })))
    expect(html).toContain('Sound on')
    expect(html).not.toContain('Sound off')
    expect(html).toMatch(/aria-pressed="true"/)
    expect(html).not.toMatch(/aria-pressed="false"/)
    expect(html).toContain('data-sound-bars="idle"')
  })
})
