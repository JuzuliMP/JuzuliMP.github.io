import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { about } from '../../app/content/about'
import { experience } from '../../app/content/experience'
import { home } from '../../app/content/home'
import { profile } from '../../app/content/profile'
import { projects, getProject } from '../../app/content/projects'
import { skills } from '../../app/content/skills'
import { PROJECT_SLUGS } from '../../app/content/types'

const publicDir = join(__dirname, '..', '..', 'public')
const exists = (src: string) => existsSync(join(publicDir, src))

describe('projects', () => {
  it('has the five projects in order with unique slugs and numbers', () => {
    expect(projects.map((p) => p.slug)).toEqual([...PROJECT_SLUGS])
    expect(new Set(projects.map((p) => p.slug)).size).toBe(5)
    expect(projects.map((p) => p.number)).toEqual(['001', '002', '003', '004', '005'])
  })

  it('loops next-project links through all five', () => {
    const seen: string[] = []
    let current = projects[0]
    for (let i = 0; i < projects.length; i++) {
      seen.push(current.slug)
      current = getProject(current.nextSlug)!
      expect(current).toBeDefined()
    }
    expect(new Set(seen).size).toBe(5)
    expect(current.slug).toBe(projects[0].slug)
  })

  it('references only image files that exist under public/', () => {
    for (const p of projects) {
      expect(exists(p.cover.src), p.cover.src).toBe(true)
      expect(p.screenshots.length).toBeGreaterThan(0)
      for (const s of p.screenshots) {
        expect(exists(s.src), s.src).toBe(true)
        expect(s.alt.length).toBeGreaterThan(0)
        expect(s.caption.length).toBeGreaterThan(0)
      }
    }
    expect(exists(profile.portrait.src)).toBe(true)
  })

  it('gives every project the facts and a one-sentence meta description', () => {
    for (const p of projects) {
      expect(p.facts.role && p.facts.company && p.facts.year && p.facts.platforms).toBeTruthy()
      expect(p.metaDescription.length).toBeLessThanOrEqual(170)
      expect(p.cover.alt && p.cover.listAlt).toBeTruthy()
    }
  })

  it('Topsite has no stack tags and only two sections; the others have four', () => {
    const topsite = getProject('topsite')!
    expect(topsite.stack).toBeUndefined()
    expect(topsite.sections.map((s) => s.title)).toEqual(['The product', 'My role'])
    for (const p of projects.filter((x) => x.slug !== 'topsite')) {
      expect(p.stack?.length).toBeGreaterThan(0)
      expect(p.sections.map((s) => s.title)).toEqual([
        'The product',
        'My role',
        "How it's built",
        'The interesting part',
      ])
    }
  })

  it('uses the first store release year for the freelance apps', () => {
    expect(getProject('ablemart')!.facts.year).toBe('2024')
    expect(getProject('ablemart')!.facts.platforms).toBe('iOS · Android')
    expect(getProject('topsite')!.facts.year).toBe('2024')
  })

  it('has no [bracketed] placeholders left anywhere in project content', () => {
    for (const p of projects) {
      expect(JSON.stringify(p), p.slug).not.toMatch(/\[[A-Z][^\]]*\]/)
    }
  })
})

describe('other content', () => {
  it('profile uses the site email for the mailto link', () => {
    expect(profile.emailHref).toBe(`mailto:${profile.email}`)
    expect(profile.socials.map((s) => s.label)).toEqual(['GitHub', 'LinkedIn', 'X', 'Instagram'])
    // Same accounts as the GitHub profile's social links.
    expect(profile.socials.find((s) => s.id === 'instagram')?.href).toBe('https://www.instagram.com/juzuli._/')
    for (const s of profile.socials) expect(s.href).toMatch(/^https:\/\//)
  })

  it('home teaser references real projects', () => {
    expect(home.selectedApps.slugs).toEqual(['ychat', 'superr-parents', 'ablemart'])
    for (const slug of home.selectedApps.slugs) expect(getProject(slug)).toBeDefined()
    expect(home.chapters.map((c) => c.shape)).toEqual(['phone', 'code', 'globe'])
    expect(home.writing.articles).toHaveLength(3)
  })

  it('about has three roles and four toolkit groups, Mobile including Kotlin', () => {
    expect(experience).toHaveLength(3)
    expect(skills).toHaveLength(4)
    expect(skills[0].items).toContain('Kotlin')
    expect(about.bio).toHaveLength(2)
  })
})
