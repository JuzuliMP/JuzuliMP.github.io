// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import { WorkPage } from '../../app/pages/WorkPage'
import { projects, workPage } from '../../app/content/projects'

function stubMatchMedia(matching: (query: string) => boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: matching(query),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }),
  )
  window.matchMedia = globalThis.matchMedia
}

/** jsdom has no PointerEvent, so pointerType and coordinates are attached by hand.
 * React derives onPointerEnter from pointerover. */
function pointerEnter(el: Element, pointerType: string, clientX = 0, clientY = 0) {
  const event = createEvent.pointerOver(el)
  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    clientX: { value: clientX },
    clientY: { value: clientY },
  })
  fireEvent(el, event)
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('WorkPage', () => {
  it('has one h1 with the title and the (05) count, plus the intro', () => {
    stubMatchMedia(() => false)
    render(<WorkPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain(workPage.title)
    expect(h1.textContent).toContain('(05)')
    expect(screen.getByText(workPage.intro)).toBeTruthy()
  })

  it('lists the five apps in order, each row one link to its project page', () => {
    stubMatchMedia(() => false)
    render(<WorkPage />)
    const list = screen.getByRole('list')
    const links = within(list).getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/work/ychat/',
      '/work/superr-parents/',
      '/work/superr-child/',
      '/work/ablemart/',
      '/work/topsite/',
    ])
    links.forEach((link, i) => {
      const p = projects[i]!
      expect(link.getAttribute('aria-label')).toBeNull()
      expect(screen.getByRole('link', { name: `${p.name} ${p.tagline}` })).toBe(link)
      // The number is shown but is not part of the link's accessible name.
      expect(link.textContent).toContain(p.number)
      expect(link.querySelector('img')?.getAttribute('src')).toBe(p.cover.src)
    })
  })

  it('gives every row thumbnail alt text and intrinsic dimensions', () => {
    stubMatchMedia(() => false)
    const { container } = render(<WorkPage />)
    const imgs = container.querySelectorAll('ol img')
    expect(imgs).toHaveLength(5)
    imgs.forEach((img) => {
      expect(img.getAttribute('alt')).toBeTruthy()
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0)
    })
  })

  it('renders no cursor preview without a fine pointer (touch, mobile)', () => {
    stubMatchMedia(() => false)
    const { container } = render(<WorkPage />)
    expect(container.querySelector('[data-cursor-preview]')).toBeNull()
  })

  it('renders no cursor preview with reduced motion', () => {
    stubMatchMedia((q) => q.includes('hover: hover') || q.includes('reduce'))
    const { container } = render(<WorkPage />)
    expect(container.querySelector('[data-cursor-preview]')).toBeNull()
  })

  it('renders an aria-hidden, unfocusable preview for a mouse and shows it only while hovering', () => {
    stubMatchMedia((q) => q.includes('hover: hover') && !q.includes('reduce'))
    const { container } = render(<WorkPage />)
    const preview = container.querySelector('[data-cursor-preview]') as HTMLElement
    expect(preview).not.toBeNull()
    expect(preview.getAttribute('aria-hidden')).toBe('true')
    expect(preview.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
    preview.querySelectorAll('img').forEach((img) => expect(img.getAttribute('alt')).toBe(''))
    expect(preview.textContent).toContain(workPage.hoverChip)
    // The preview is not in the accessibility tree and does not change the link names.
    expect(screen.getAllByRole('link')).toHaveLength(5)

    const inner = preview.firstElementChild as HTMLElement
    expect(inner.className).toContain('opacity-0')
    const row = screen.getAllByRole('link')[1]!
    pointerEnter(row, 'mouse', 300, 400)
    expect(inner.className).toContain('opacity-100')
    const imgs = preview.querySelectorAll('img')
    expect(imgs[1]!.className).toContain('opacity-100')
    expect(imgs[0]!.className).toContain('opacity-0')
    fireEvent.pointerLeave(screen.getByRole('list'))
    expect(inner.className).toContain('opacity-0')
  })

  it('ignores touch pointers and keyboard focus for the preview', () => {
    stubMatchMedia((q) => q.includes('hover: hover') && !q.includes('reduce'))
    const { container } = render(<WorkPage />)
    const preview = container.querySelector('[data-cursor-preview]') as HTMLElement
    const inner = preview.firstElementChild as HTMLElement
    const row = screen.getAllByRole('link')[0]!
    pointerEnter(row, 'touch', 10, 10)
    expect(inner.className).toContain('opacity-0')
    row.focus()
    expect(inner.className).toContain('opacity-0')
    expect(preview.querySelectorAll('img')[0]!.className).toContain('opacity-0')
  })
})
