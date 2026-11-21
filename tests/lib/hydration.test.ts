import { describe, expect, it } from 'vitest'
import { prerender } from '../../src/prerender'
import {
  ROUTE_META_NAME,
  canHydrate,
  notFoundRoute,
  resolveRoute,
  routeKey,
  routes,
} from '../../app/lib/routes'

const allRoutes = [...routes, notFoundRoute]

describe('routeKey()', () => {
  it('is unique for every route', () => {
    const keys = allRoutes.map(routeKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('names project routes by slug', () => {
    expect(routeKey(resolveRoute('/work/ychat/'))).toBe('project:ychat')
    expect(routeKey(resolveRoute('/'))).toBe('home')
    expect(routeKey(resolveRoute('/no/such/page/'))).toBe('not-found')
  })
})

describe('canHydrate()', () => {
  const home = resolveRoute('/')
  const unknown = resolveRoute('/work/unknown-app/')

  it('hydrates prerendered markup built for the same route', () => {
    expect(canHydrate(true, 'home', home)).toBe(true)
    // GitHub Pages serves 404.html (key "not-found") for unknown URLs.
    expect(canHydrate(true, 'not-found', unknown)).toBe(true)
  })

  it('renders from scratch when the markup belongs to another route', () => {
    // An SPA fallback serves the home page's HTML for an unknown URL.
    expect(canHydrate(true, 'home', unknown)).toBe(false)
    expect(canHydrate(true, 'project:ychat', resolveRoute('/work/topsite/'))).toBe(false)
  })

  it('renders from scratch when there is no markup or no route meta (dev server)', () => {
    expect(canHydrate(false, 'home', home)).toBe(false)
    expect(canHydrate(true, null, home)).toBe(false)
    expect(canHydrate(true, undefined, home)).toBe(false)
  })
})

describe('prerender() route meta', () => {
  it.each(allRoutes.map((r) => r.path))('stamps %s with its route key', async (path) => {
    const { head } = await prerender({ url: path })
    const meta = [...head.elements].filter((e) => e.type === 'meta' && e.props.name === ROUTE_META_NAME)
    expect(meta).toHaveLength(1)
    expect(meta[0]!.props.content).toBe(routeKey(resolveRoute(path)))
  })
})
