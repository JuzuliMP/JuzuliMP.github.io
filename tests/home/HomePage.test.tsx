// @vitest-environment jsdom
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Chapter } from '../../app/components/home/Chapter'
import { Hero } from '../../app/components/home/Hero'
import { LOADER_ELEMENT_ID, LOADER_REVEAL_SCRIPT, LOADER_STORAGE_KEY, resetLoaderGate } from '../../app/components/home/loaderGate'
import { SCENE_ANCHOR_ATTR, SCENE_TEXT_ATTR } from '../../app/components/home/particles/layout'
import { articleOrder, sortNewestFirst } from '../../app/components/home/Writing'
import { home } from '../../app/content/home'
import { profile } from '../../app/content/profile'
import { requireProject } from '../../app/content/projects'
import { HomePage } from '../../app/pages/HomePage'
import { stubBrowser } from './setup'

/**
 * Runs the inline reveal script as the browser would while parsing. Its
 * failsafe timer is faked and cleared: these tests hydrate right away, and a
 * real 6 s timer would outlive the test environment (covered in loader.test).
 */
function runRevealScript() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    new Function(LOADER_REVEAL_SCRIPT)()
  } finally {
    vi.clearAllTimers()
    vi.useRealTimers()
  }
}

beforeEach(() => {
  resetLoaderGate()
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('HomePage content', () => {
  beforeEach(() => {
    stubBrowser()
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1') // loader already played
  })

  it('renders one h1 with the name and the hero content', () => {
    render(<HomePage />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]!.textContent).toContain('Mohammed')
    expect(h1s[0]!.textContent).toContain('Juzuli M P')
    expect(screen.getByText(home.hero.eyebrow)).toBeTruthy()
    expect(screen.getByText(home.hero.bio)).toBeTruthy()
  })

  it('links the three social pills to the profile URLs, opening in a new tab', () => {
    render(<HomePage />)
    const nav = screen.getByRole('navigation', { name: 'Social links' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(profile.socials.map((s) => s.href))
    for (const a of links) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    }
    expect(links.map((a) => a.textContent)).toEqual(['GitHub↗', 'LinkedIn↗', 'X↗', 'Instagram↗'])
  })

  it('renders the three chapters with their word, lead, body and tags', () => {
    render(<HomePage />)
    const sections = home.chapters.map((c) => document.getElementById(`chapter-${c.number}`)!)
    expect(sections.every(Boolean)).toBe(true)
    home.chapters.forEach((c, i) => {
      const section = sections[i]!
      const heading = within(section).getByRole('heading', { level: 2 })
      expect(heading.textContent).toContain(c.word)
      expect(within(section).getByText(c.lead)).toBeTruthy()
      expect(within(section).getByText(c.body)).toBeTruthy()
      for (const tag of c.tags) expect(within(section).getByText(tag)).toBeTruthy()
      expect(section.getAttribute('aria-labelledby')).toBe(heading.id)
      // Phones: the text block the scene dims the particles under, then the empty stage the icon finishes in.
      const textBlocks = section.querySelectorAll(`[${SCENE_TEXT_ATTR}]`)
      expect(textBlocks).toHaveLength(1)
      expect(textBlocks[0]!.contains(heading)).toBe(true)
      const anchors = section.querySelectorAll(`[${SCENE_ANCHOR_ATTR}]`)
      expect(anchors).toHaveLength(1)
      expect(anchors[0]!.getAttribute('aria-hidden')).toBe('true')
      expect(textBlocks[0]!.parentElement).toBe(section)
      expect(section.lastElementChild).toBe(anchors[0])
      // Nothing is inside the stage: it is a pure layout block.
      expect(anchors[0]!.childElementCount).toBe(0)
      // No pinning: nothing in the chapter is sticky.
      expect(section.querySelector('[data-chapter-pin]')).toBeNull()
    })
    expect(home.chapters.map((c) => c.word)).toEqual(['Design', 'Build', 'Ship'])
  })

  it('links the three selected apps to their project pages with a described cover', () => {
    render(<HomePage />)
    const section = document.getElementById('selected-apps')!
    const links = within(section)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/work/') && a.getAttribute('href') !== '/work/')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/work/ychat/',
      '/work/superr-parents/',
      '/work/ablemart/',
    ])
    for (const slug of home.selectedApps.slugs) {
      const p = requireProject(slug)
      const link = links.find((a) => a.getAttribute('href') === `/work/${slug}/`)!
      const img = link.querySelector('img')!
      expect(img.getAttribute('src')).toBe(p.cover.src)
      expect(img.getAttribute('alt')).toBe(p.cover.listAlt)
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0)
      expect(link.textContent).toContain(p.name)
    }
    const all = within(section).getByRole('link', { name: /All work/ })
    expect(all.getAttribute('href')).toBe('/work/')
    expect(all.hasAttribute('target')).toBe(false)
  })

  it('renders the open source card with pub.dev and GitHub links', () => {
    render(<HomePage />)
    const pkg = home.openSource.package
    expect(screen.getByRole('heading', { level: 3, name: pkg.name })).toBeTruthy()
    const pub = screen.getByRole('link', { name: /pub\.dev/ })
    expect(pub.getAttribute('href')).toBe('https://pub.dev/packages/office_viewer')
    expect(pub.getAttribute('rel')).toBe('noopener noreferrer')
    const card = screen.getByRole('region', { name: home.openSource.heading })
    const links = within(card).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(pkg.links.map((l) => l.href))
    for (const a of links) expect(a.getAttribute('target')).toBe('_blank')
  })

  it('lists three articles newest first as external links', () => {
    render(<HomePage />)
    const section = screen.getByRole('region', { name: home.writing.heading })
    const rows = within(section).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    for (const li of rows) {
      const a = within(li).getByRole('link')
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener noreferrer')
      expect(a.getAttribute('href')).toMatch(/^https:\/\/juzuli\.medium\.com\//)
    }
    const order = rows.map((li) => articleOrder(within(li).getByRole('link').textContent!.match(/[A-Z][a-z]{2} \d{4}/)![0]))
    expect([...order].sort((a, b) => b - a)).toEqual(order)
    const all = within(section).getByRole('link', { name: /All articles/ })
    expect(all.getAttribute('href')).toBe(home.writing.link.href)
    expect(all.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('ends with the contact call to action', () => {
    render(<HomePage />)
    const talk = screen.getByRole('link', { name: "Let's talk" })
    expect(talk.getAttribute('href')).toBe(profile.emailHref)
    expect(screen.getByRole('heading', { level: 2, name: /Have an app in mind/ })).toBeTruthy()
    // Second option after "Let's talk": the About page, opened in the same tab.
    const cta = screen.getByRole('region', { name: /Have an app in mind/ })
    const about = within(cta).getByRole('link', { name: /Or learn more about me/ })
    expect(about.getAttribute('href')).toBe('/about/')
    expect(about.getAttribute('target')).toBeNull()
    expect(about.textContent).toBe('Or learn more about me→')
  })

  it('keeps heading levels in order (one h1, h2 sections, h3 only inside Open source)', () => {
    render(<HomePage />)
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    expect(levels.filter((l) => l === 1)).toHaveLength(1)
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1)
  })
})

describe('articles', () => {
  it('sorts newest first and keeps the written order within a month', () => {
    const sorted = sortNewestFirst([
      { date: 'Jul 2024', title: 'a', href: '1' },
      { date: 'Apr 2026', title: 'b', href: '2' },
      { date: 'Jul 2024', title: 'c', href: '3' },
      { date: 'Dec 2025', title: 'd', href: '4' },
      { date: 'soon', title: 'e', href: '5' },
    ])
    expect(sorted.map((a) => a.title)).toEqual(['b', 'd', 'a', 'c', 'e'])
  })

  it('ships the content already in that order', () => {
    expect(sortNewestFirst(home.writing.articles)).toEqual(home.writing.articles)
  })
})

describe('server-rendered HTML', () => {
  const html = () => renderToString(<HomePage />)

  it('has no <canvas>, so the scene never runs during prerender', () => {
    expect(html()).not.toContain('<canvas')
  })

  it('has an empty, hidden-from-AT scene container', () => {
    expect(html()).toMatch(/<div[^>]*data-particle-scene[^>]*aria-hidden="true"[^>]*><\/div>|<div[^>]*aria-hidden="true"[^>]*data-particle-scene[^>]*><\/div>/)
  })

  it('contains the loader only as a hidden shell, so visitors without JS never see it', () => {
    const out = html()
    const match = out.match(new RegExp(`<div[^>]*id="${LOADER_ELEMENT_ID}"[^>]*>`))
    expect(match).not.toBeNull()
    expect(match![0]).toMatch(/\shidden(=""|\s|>)/)
    expect(match![0]).toContain('data-phase="boot"')
    expect(out).toContain('getElementById')
  })

  it('carries every piece of content with no JavaScript', () => {
    const out = html().replace(/<!-- -->/g, '')
    for (const c of home.chapters) for (const s of [c.word, c.lead, c.body, ...c.tags]) expect(out).toContain(s.replace(/'/g, '&#x27;'))
    expect(out).toContain(home.hero.nameLines[0])
    expect(out).toContain(home.openSource.package.name)
    for (const a of home.writing.articles) expect(out).toContain(a.href)
    // Hero text is only hidden by CSS under html.js, never by inline styles.
    expect(out).not.toMatch(/style="[^"]*(opacity|translate)/)
  })

  it('hydrates cleanly, with the loader unhidden by the inline script as on a first visit', async () => {
    stubBrowser()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = html()
    // The browser runs this inline script while parsing; innerHTML does not, so do it here.
    runRevealScript()
    expect((document.getElementById(LOADER_ELEMENT_ID) as HTMLElement).hidden).toBe(false)

    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(
        container,
        <StrictMode>
          <HomePage />
        </StrictMode>,
      )
    })
    expect(errors).not.toHaveBeenCalled()
    // The loader is up (first visit) and the scene container is still empty (no WebGL).
    expect(document.getElementById(LOADER_ELEMENT_ID)).not.toBeNull()
    expect(container.querySelector('canvas')).toBeNull()
    // Unmount so the running loader's interval is cleared before the test environment goes away.
    act(() => root!.unmount())
    container.remove()
  })

  it('leaves the loader hidden and removes it on a return visit', async () => {
    stubBrowser()
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = html()
    runRevealScript()
    expect((document.getElementById(LOADER_ELEMENT_ID) as HTMLElement).hidden).toBe(true)
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, <HomePage />)
    })
    expect(document.getElementById(LOADER_ELEMENT_ID)).toBeNull()
    act(() => root!.unmount())
    container.remove()
  })
})

describe('no WebGL', () => {
  it('renders nothing for the scene, logs no errors and the page is fully usable', async () => {
    const { getContext } = stubBrowser()
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warns = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<HomePage />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(getContext).toHaveBeenCalled()
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(errors).not.toHaveBeenCalled()
    expect(warns).not.toHaveBeenCalled()
  })
})

describe('reveal', () => {
  it('shows chapter text without JS state: no pending state in the server HTML for scroll groups', () => {
    const out = renderToString(<Chapter chapter={home.chapters[0]!} index={0} />)
    expect(out).toContain('data-reveal-state="idle"')
    expect(out).not.toContain('data-reveal-state="pending"')
  })

  it('renders the hero group as pending, which home.css only hides under html.js', () => {
    const out = renderToString(<Hero hero={home.hero} socials={profile.socials} />)
    expect(out).toContain('data-reveal-mode="hero"')
    expect(out).toContain('data-reveal-state="pending"')
  })

  it('opens the hero once there is no loader to wait for, and arms scroll groups only below the fold', async () => {
    stubBrowser()
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
    vi.stubGlobal('innerHeight', 800)
    const { container } = render(
      <>
        <Hero hero={home.hero} socials={profile.socials} />
        <Chapter chapter={home.chapters[0]!} index={0} />
      </>,
    )
    await act(async () => {})
    const hero = container.querySelector('[data-reveal-mode="hero"]')!
    expect(hero.getAttribute('data-reveal-state')).toBe('in')
    // jsdom lays everything out at top 0, so the chapter counts as on screen and stays visible.
    const chapter = container.querySelector('[data-reveal-mode="scroll"]')!
    expect(chapter.getAttribute('data-reveal-state')).toBe('idle')
  })
})
