// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { ProjectPage } from '../../app/pages/ProjectPage'
import { projectPage, projects } from '../../app/content/projects'
import { PROJECT_SLUGS } from '../../app/content/types'
import { WithPlaceholders } from '../../app/components/project/Placeholders'

beforeEach(() => {
  // jsdom has no IntersectionObserver: reveals fall back to "shown".
  vi.stubGlobal('IntersectionObserver', undefined)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe.each(projects)('ProjectPage: $slug', (project) => {
  it('has one h1 with the project name and a decorative lime dot', () => {
    render(<ProjectPage slug={project.slug} />)
    const h1 = screen.getByRole('heading', { level: 1, name: project.name })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(h1.textContent).toBe(`${project.name}.`)
    expect(h1.querySelector('[aria-hidden="true"]')?.textContent).toBe('.')
  })

  it('shows the back link, number and domain, summary and cover', () => {
    const { container } = render(<ProjectPage slug={project.slug} />)
    expect(screen.getByRole('link', { name: /all work/i }).getAttribute('href')).toBe('/work/')
    expect(container.textContent).toContain(`${project.number} — ${project.domain}`)
    expect(screen.getByText(project.summary)).toBeTruthy()
    const cover = screen.getByAltText(project.cover.alt) as HTMLImageElement
    expect(cover.getAttribute('src')).toBe(project.cover.src)
    expect(cover.getAttribute('width')).toBe(String(project.cover.width))
    expect(cover.getAttribute('height')).toBe(String(project.cover.height))
  })

  it('renders the four facts', () => {
    const { container } = render(<ProjectPage slug={project.slug} />)
    const dl = container.querySelector('dl')!
    const terms = [...dl.querySelectorAll('dt')].map((d) => d.textContent)
    expect(terms).toEqual(['Role', 'Company', 'Year', 'Platforms'])
    const values = [...dl.querySelectorAll('dd')].map((d) => d.textContent)
    expect(values).toEqual([
      project.facts.role,
      project.facts.company,
      project.facts.year,
      project.facts.platforms,
    ])
  })

  it('renders case-study sections in content order', () => {
    render(<ProjectPage slug={project.slug} />)
    const region = screen.getByRole('region', { name: projectPage.caseStudyLabel })
    const headings = within(region).getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(project.sections.map((s) => s.title))
    project.sections.forEach((s) => expect(within(region).getByText(s.body)).toBeTruthy())
  })

  it('renders every screenshot with alt text, size, lazy loading and a caption', () => {
    const { container } = render(<ProjectPage slug={project.slug} />)
    const figures = container.querySelectorAll('figure')
    expect(figures).toHaveLength(project.screenshots.length)
    project.screenshots.forEach((shot, i) => {
      const fig = figures[i]!
      const img = fig.querySelector('img')!
      expect(img.getAttribute('src')).toBe(shot.src)
      expect(img.getAttribute('alt')).toBe(shot.alt)
      expect(img.getAttribute('alt')!.length).toBeGreaterThan(0)
      expect(img.getAttribute('width')).toBe(String(shot.width))
      expect(img.getAttribute('height')).toBe(String(shot.height))
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(fig.querySelector('figcaption')?.textContent).toBe(shot.caption)
    })
  })

  it('places the screenshots after the text sections', () => {
    const { container } = render(<ProjectPage slug={project.slug} />)
    const region = screen.getByRole('region', { name: projectPage.caseStudyLabel })
    const strip = container.querySelector('[data-screenshot-strip]')!
    expect(region.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('links to the next project in the loop with its number, name and cover', () => {
    const { container } = render(<ProjectPage slug={project.slug} />)
    const next = projects.find((p) => p.slug === project.nextSlug)!
    const link = screen.getByRole('link', { name: `${projectPage.nextEyebrow}: ${next.name}` })
    expect(link.getAttribute('href')).toBe(`/work/${next.slug}/`)
    expect(link.textContent).toContain(next.number)
    expect(link.querySelector('img')?.getAttribute('src')).toBe(next.cover.src)
    expect(container.textContent).toContain(projectPage.nextEyebrow)
  })

  it('links to the external store / site in a new tab', () => {
    render(<ProjectPage slug={project.slug} />)
    const label = project.link.label.replace(/\s*↗$/, '')
    const link = screen.getByRole('link', { name: new RegExp(label.replace(/[.]/g, '\\.')) })
    expect(link.getAttribute('href')).toBe(project.link.href)
    expect(link.getAttribute('target')).toBe('_blank')
  })
})

describe('ProjectPage content rules', () => {
  it('has a next-project loop that visits every project once', () => {
    const seen: string[] = []
    let slug = PROJECT_SLUGS[0] as string
    for (let i = 0; i < PROJECT_SLUGS.length; i++) {
      seen.push(slug)
      slug = projects.find((p) => p.slug === slug)!.nextSlug
    }
    expect(new Set(seen).size).toBe(PROJECT_SLUGS.length)
    expect(slug).toBe(PROJECT_SLUGS[0])
  })

  it('YChat has seven stack tags, four sections and four screenshots', () => {
    const { container } = render(<ProjectPage slug="ychat" />)
    expect(container.querySelectorAll('ul > li')).toHaveLength(7)
    const region = screen.getByRole('region', { name: projectPage.caseStudyLabel })
    expect(within(region).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'The product',
      'My role',
      "How it's built",
      'The interesting part',
    ])
    expect(container.querySelectorAll('figure')).toHaveLength(4)
  })

  it('Topsite has no stack tags and exactly two sections', () => {
    const { container } = render(<ProjectPage slug="topsite" />)
    expect(container.querySelector('ul > li')).toBeNull()
    const region = screen.getByRole('region', { name: projectPage.caseStudyLabel })
    expect(within(region).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'The product',
      'My role',
    ])
    expect(container.querySelectorAll('figure')).toHaveLength(3)
  })

  it('renders no placeholders now that every fact is filled in', () => {
    for (const p of projects) {
      const { container, unmount } = render(<ProjectPage slug={p.slug} />)
      expect(container.querySelector('[data-placeholder]'), p.slug).toBeNull()
      unmount()
    }
    const ablemart = render(<ProjectPage slug="ablemart" />)
    expect(ablemart.container.textContent).toContain('iOS · Android')
    expect(ablemart.container.textContent).toContain('2024')
  })

  it('WithPlaceholders keeps surrounding text and marks every bracket pair', () => {
    const { container } = render(
      <p>
        <WithPlaceholders text="From [ADD: year] to now [CHECK]." />
      </p>,
    )
    expect(container.textContent).toBe('From [ADD: year] to now [CHECK].')
    expect(container.querySelectorAll('[data-placeholder]')).toHaveLength(2)
  })

  it('shows hidden-until-reveal content in the server markup (no JS state applied before mount)', () => {
    // Before effects run, a Reveal is "hidden" only through html.js-scoped classes.
    const { container } = render(<ProjectPage slug="ychat" />)
    container.querySelectorAll('[data-reveal]').forEach((el) => {
      expect(el.className).not.toMatch(/(^|\s)opacity-0(\s|$)/)
    })
  })
})
