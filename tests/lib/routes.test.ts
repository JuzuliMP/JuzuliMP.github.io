import { describe, expect, it } from 'vitest'
import { projects } from '../../app/content/projects'
import {
  activeNav,
  getRouteHead,
  notFoundRoute,
  resolveRoute,
  routes,
} from '../../app/lib/routes'

describe('resolveRoute', () => {
  it('resolves the top-level pages with trailing slashes', () => {
    expect(resolveRoute('/').kind).toBe('home')
    expect(resolveRoute('/about/').kind).toBe('about')
    expect(resolveRoute('/work/').kind).toBe('work')
  })

  it('tolerates a missing trailing slash (the prerender plugin passes /about)', () => {
    expect(resolveRoute('/about').kind).toBe('about')
    expect(resolveRoute('/work').kind).toBe('work')
    expect(resolveRoute('').kind).toBe('home')
  })

  it('tolerates index.html, query strings and hashes', () => {
    expect(resolveRoute('/index.html').kind).toBe('home')
    expect(resolveRoute('/about/index.html').kind).toBe('about')
    expect(resolveRoute('/work/?x=1').kind).toBe('work')
    expect(resolveRoute('/work/#top').kind).toBe('work')
  })

  it.each(projects.map((p) => p.slug))('resolves project %s with and without a trailing slash', (slug) => {
    for (const path of [`/work/${slug}/`, `/work/${slug}`, `/work/${slug}/index.html`]) {
      const route = resolveRoute(path)
      expect(route.kind).toBe('project')
      expect(route.kind === 'project' && route.slug).toBe(slug)
    }
  })

  it('sends unknown paths to not-found', () => {
    for (const path of ['/nope/', '/work/unknown/', '/about/team/', '/404', '/404.html', '/work/ychat/extra/']) {
      expect(resolveRoute(path)).toEqual(notFoundRoute)
    }
  })
})

describe('route table', () => {
  it('has the eight real routes, all with trailing slashes', () => {
    expect(routes.map((r) => r.path)).toEqual([
      '/',
      '/about/',
      '/work/',
      '/work/ychat/',
      '/work/superr-parents/',
      '/work/superr-child/',
      '/work/ablemart/',
      '/work/topsite/',
    ])
  })

  it('marks Work as the active nav item on project pages', () => {
    expect(activeNav(resolveRoute('/work/ychat/'))).toBe('work')
    expect(activeNav(resolveRoute('/about/'))).toBe('about')
    expect(activeNav(notFoundRoute)).toBeNull()
  })
})

describe('route head data', () => {
  it('uses the agreed titles', () => {
    expect(getRouteHead(resolveRoute('/')).title).toBe('Mohammed Juzuli M P · Software Engineer')
    expect(getRouteHead(resolveRoute('/about/')).title).toBe('About · Mohammed Juzuli M P')
    expect(getRouteHead(resolveRoute('/work/')).title).toBe('Selected apps · Mohammed Juzuli M P')
    expect(getRouteHead(resolveRoute('/work/superr-parents/')).title).toBe('Superr Parents · case study')
    expect(getRouteHead(notFoundRoute).title).toBe('Page not found')
  })

  it('builds canonical URLs from the path', () => {
    expect(getRouteHead(resolveRoute('/work/ablemart/')).canonical).toBe(
      'https://juzulimp.github.io/work/ablemart/',
    )
    expect(getRouteHead(resolveRoute('/')).canonical).toBe('https://juzulimp.github.io/')
  })

  it('only the not-found page is noindex', () => {
    for (const r of routes) expect(getRouteHead(r).index).toBe(true)
    expect(getRouteHead(notFoundRoute).index).toBe(false)
  })
})
