import { describe, expect, it } from 'vitest'
import { prerender } from '../src/prerender'
import { notFoundRoute, routes, getRouteHead, SITE_URL } from '../app/lib/routes'
import { projects } from '../app/content/projects'

const expectedH1: Record<string, string> = {
  '/': 'Mohammed Juzuli M P',
  '/about/': 'App Developer & UI/UX Designer',
  '/work/': 'Selected apps',
  ...Object.fromEntries(projects.map((p) => [`/work/${p.slug}/`, p.name])),
  [notFoundRoute.path]: 'Page not found',
}

function text(html: string): string {
  return html
    .replace(/<!--.*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const allRoutes = [...routes, notFoundRoute]

describe('prerender()', () => {
  it.each(allRoutes.map((r) => r.path))('renders %s with exactly one h1', async (path) => {
    // The plugin passes URLs without a trailing slash; both must work.
    const url = path === '/' ? '/' : path.replace(/\/$/, '')
    const { html } = await prerender({ url })
    const h1s = html.match(/<h1[\s\S]*?<\/h1>/g) ?? []
    expect(h1s).toHaveLength(1)
    expect(text(h1s[0]!)).toContain(expectedH1[path])
    expect(html).toContain('<main')
    expect(html).toContain('<header')
    expect(html).toContain('<footer')
  })

  it('gives every route a unique title and a correct canonical URL', async () => {
    const titles = new Set<string>()
    for (const route of allRoutes) {
      const { head } = await prerender({ url: route.path })
      expect(head.lang).toBe('en')
      expect(head.title).toBe(getRouteHead(route).title)
      titles.add(head.title)

      const elements = [...head.elements]
      const canonical = elements.find((e) => e.type === 'link' && e.props.rel === 'canonical')
      const ogUrl = elements.find((e) => e.props.property === 'og:url')
      if (route.kind === 'not-found') {
        // Not indexed, so it has no canonical URL.
        expect(canonical).toBeUndefined()
        expect(ogUrl).toBeUndefined()
        expect(elements.find((e) => e.props.name === 'robots')?.props.content).toContain('noindex')
      } else {
        expect(canonical?.props.href).toBe(`${SITE_URL}${route.path}`)
        expect(ogUrl?.props.content).toBe(`${SITE_URL}${route.path}`)
      }
      expect(elements.find((e) => e.props.property === 'og:title')?.props.content).toBe(head.title)
      expect(elements.find((e) => e.props.name === 'description')?.props.content?.length).toBeGreaterThan(40)
      expect(elements.find((e) => e.props.name === 'twitter:card')?.props.content).toBe('summary_large_image')
    }
    expect(titles.size).toBe(allRoutes.length)
  })

  it('lists every route in links so each page is emitted', async () => {
    const { links } = await prerender({ url: '/' })
    for (const route of routes) expect(links.has(route.path)).toBe(true)
    expect(links.size).toBe(routes.length)
  })

  it('marks the active nav item on the server-rendered page', async () => {
    const { html } = await prerender({ url: '/work/ychat' })
    expect(html).toMatch(/<a href="\/work\/"[^>]*aria-current="page"/)
    const home = await prerender({ url: '/' })
    expect(home.html).toMatch(/<a href="\/"[^>]*aria-current="page"/)
  })

  it('links project pages onward in a loop', async () => {
    const { html } = await prerender({ url: '/work/topsite/' })
    expect(html).toContain('href="/work/ychat/"')
  })
})
