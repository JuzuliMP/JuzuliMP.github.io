// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { AboutPage } from '../../app/pages/AboutPage'
import { about } from '../../app/content/about'
import { experience } from '../../app/content/experience'
import { skills } from '../../app/content/skills'
import { profile } from '../../app/content/profile'

beforeAll(() => {
  class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  )
})

afterEach(cleanup)

describe('AboutPage', () => {
  it('has one h1 with both headline lines', () => {
    render(<AboutPage />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    const text = (h1s[0]!.textContent ?? '').replace(/\s+/g, ' ').trim()
    expect(text).toContain('App Developer')
    expect(text).toContain('& UI/UX Designer')
    expect(text).toBe('App Developer & UI/UX Designer')
  })

  it('shows the Bangalore note', () => {
    render(<AboutPage />)
    expect(screen.getByText(about.note)).toBeTruthy()
  })

  it('renders the portrait with alt text and real dimensions', () => {
    render(<AboutPage />)
    const img = screen.getByAltText(profile.portrait.alt)
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe('/images/portrait.jpg')
    expect(img.getAttribute('width')).toBe('930')
    expect(img.getAttribute('height')).toBe('1400')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('renders the lead and both bio paragraphs', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 2, name: about.lead })).toBeTruthy()
    for (const p of about.bio) expect(screen.getByText(p)).toBeTruthy()
  })

  it('lists the three roles in order, with the range', () => {
    render(<AboutPage />)
    const section = screen.getByRole('region', { name: 'Experience' })
    expect(within(section).getByText('2022 — now')).toBeTruthy()
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    const roles = items.map((li) => within(li).getByRole('heading', { level: 3 }).textContent)
    expect(roles).toEqual(['Software Engineer', 'Mobile Application Developer', 'Jr Flutter Developer'])
    expect(roles).toEqual(experience.map((e) => e.role))
    expect(items[0]!.textContent).toContain('Aug 2025 — now')
    expect(items[0]!.textContent).toContain('YACHII PTE. LTD.')
    expect(items[2]!.textContent).toContain('Apr 2022 — Jun 2022')
  })

  it('server HTML fills only the current role dot (rest state)', () => {
    const html = renderToString(<AboutPage />)
    expect([...html.matchAll(/data-filled="(true|false)"/g)].map((m) => m[1])).toEqual(['true', 'false', 'false'])
  })

  it('fills dots as rows pass 60% of the viewport, and empties them on scroll back', async () => {
    const tops = [-200, 500, 900] // row 2 is above the 60% line, row 3 is not
    const spy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const i = [...document.querySelectorAll('ol > li')].indexOf(this as HTMLLIElement)
        const top = i >= 0 ? tops[i]! : 0
        return { top, bottom: top + 100, left: 0, right: 0, width: 0, height: 100, x: 0, y: top, toJSON() {} }
      })
    vi.stubGlobal('innerHeight', 1000)
    const { container } = render(<AboutPage />)
    const filled = () => [...container.querySelectorAll('[data-filled]')].map((d) => d.getAttribute('data-filled'))
    const scroll = () =>
      act(async () => {
        window.dispatchEvent(new Event('scroll'))
        await new Promise((r) => requestAnimationFrame(() => r(null)))
      })
    expect(filled()).toEqual(['true', 'true', 'false'])

    tops[2] = 400
    await scroll()
    expect(filled()).toEqual(['true', 'true', 'true'])

    tops[1] = 800
    tops[2] = 1200
    await scroll()
    expect(filled()).toEqual(['true', 'false', 'false'])
    spy.mockRestore()
  })

  it('shows four toolkit groups including Kotlin', () => {
    render(<AboutPage />)
    const section = screen.getByRole('region', { name: 'Toolkit' })
    const headings = within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Mobile', 'State', 'Backend & data', 'Design & tools'])
    expect(headings).toEqual(skills.map((g) => g.title))
    const mobile = headings.indexOf('Mobile')
    const group = within(section).getAllByRole('list')[mobile]!
    expect(within(group).getByText('Kotlin', { exact: false })).toBeTruthy()
    expect(group.textContent).toBe('Flutter · Dart · Swift · Kotlin · iOS · Android')
  })

  it('ends with the contact CTA: mailto and a link to the work page', () => {
    render(<AboutPage />)
    const cta = screen.getByRole('region', { name: /Need an app built with care/ })
    const talk = within(cta).getByRole('link', { name: "Let's talk" })
    expect(talk.getAttribute('href')).toBe(profile.emailHref)
    expect(talk.getAttribute('href')?.startsWith('mailto:')).toBe(true)
    const work = within(cta).getByRole('link', { name: /See the work/ })
    expect(work.getAttribute('href')).toBe('/work/')
  })

  it('does not bake a hidden state into the markup (visible without JS)', () => {
    const { container } = render(<AboutPage />)
    expect(container.querySelector('[style*="opacity"]')).toBeNull()
    expect(container.querySelector('[style*="translate"]')).toBeNull()
  })
})
