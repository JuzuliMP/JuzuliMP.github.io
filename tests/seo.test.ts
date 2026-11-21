import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  OG_IMAGE,
  SITE_URL,
  getHeadElements,
  getRouteHead,
  notFoundRoute,
  routes,
  type Route,
} from '../app/lib/routes'

const root = join(__dirname, '..')
const pub = (p: string) => join(root, 'public', p.replace(/^\//, ''))
const html = readFileSync(join(root, 'index.html'), 'utf8')

function meta(route: Route) {
  const map = new Map<string, string>()
  const links: Record<string, string> = {}
  for (const el of getHeadElements(route)) {
    if (el.type === 'meta') map.set(el.props.name ?? el.props.property, el.props.content)
    else links[el.props.rel] = el.props.href
  }
  return { map, links }
}

describe('per-route head', () => {
  const all = [...routes, notFoundRoute]

  it('gives every route a unique, non-empty title', () => {
    const titles = all.map((r) => getRouteHead(r).title)
    expect(titles.every((t) => t.trim().length > 0)).toBe(true)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('keeps every description between 50 and 160 characters, unique per route', () => {
    const descriptions = all.map((r) => getRouteHead(r).description)
    for (const d of descriptions) {
      expect(d.length).toBeGreaterThanOrEqual(50)
      expect(d.length).toBeLessThanOrEqual(160)
    }
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })

  it.each(routes.map((r) => [r.path, r] as const))('%s is indexable with a canonical URL, og and twitter tags', (path, route) => {
    const { map, links } = meta(route)
    expect(links.canonical).toBe(`${SITE_URL}${path}`)
    expect(map.get('robots')).toBe('index, follow')
    expect(map.get('og:url')).toBe(`${SITE_URL}${path}`)
    expect(map.get('og:title')).toBe(getRouteHead(route).title)
    expect(map.get('og:description')).toBe(getRouteHead(route).description)
    expect(map.get('og:type')).toBe('website')
    expect(map.get('og:image')).toBe(OG_IMAGE)
    expect(map.get('og:image:width')).toBe('1200')
    expect(map.get('og:image:height')).toBe('630')
    expect(map.get('og:image:alt')).toContain('Mohammed Juzuli M P')
    expect(map.get('twitter:card')).toBe('summary_large_image')
    expect(map.get('twitter:image')).toBe(OG_IMAGE)
    expect(map.get('twitter:title')).toBe(getRouteHead(route).title)
  })

  it('marks the not-found page noindex and gives it no canonical', () => {
    const { map, links } = meta(notFoundRoute)
    expect(map.get('robots')).toMatch(/^noindex/)
    expect(links.canonical).toBeUndefined()
    expect(map.get('twitter:card')).toBe('summary_large_image')
  })
})

describe('Open Graph image', () => {
  const file = pub('/images/og-banner.png')

  it('exists, is a 1200x630 PNG and stays small', () => {
    expect(OG_IMAGE).toBe(`${SITE_URL}/images/og-banner.png`)
    expect(existsSync(file)).toBe(true)
    const bytes = readFileSync(file)
    expect(bytes.subarray(1, 4).toString()).toBe('PNG')
    expect(bytes.readUInt32BE(16)).toBe(1200)
    expect(bytes.readUInt32BE(20)).toBe(630)
    expect(statSync(file).size).toBeLessThan(300 * 1024)
  })
})

describe('favicons and manifest', () => {
  const hrefs = [...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g)].map((m) => ({
    tag: m[0],
    href: /href="([^"]+)"/.exec(m[0])![1],
  }))

  it('links an SVG icon, a 32px PNG, an apple-touch-icon and the manifest from index.html', () => {
    const tags = hrefs.map((h) => h.tag).join('\n')
    expect(tags).toMatch(/type="image\/svg\+xml"[^>]*href="\/favicon\.svg"/)
    expect(tags).toMatch(/sizes="32x32"[^>]*href="\/favicon-32\.png"/)
    expect(tags).toMatch(/rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/)
    expect(tags).toMatch(/rel="manifest"[^>]*href="\/site\.webmanifest"/)
  })

  it('has every referenced file in public/', () => {
    for (const { href } of hrefs) expect(existsSync(pub(href)), href).toBe(true)
  })

  it('has a manifest whose icons exist and whose colours match the ink background', () => {
    const manifest = JSON.parse(readFileSync(pub('/site.webmanifest'), 'utf8'))
    expect(manifest.short_name).toBe('Juzuli')
    expect(manifest.theme_color).toBe('#0b0b0c')
    expect(manifest.background_color).toBe('#0b0b0c')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
    for (const icon of manifest.icons) expect(existsSync(pub(icon.src)), icon.src).toBe(true)
  })

  it('has correctly sized PNG icons, an opaque touch icon, and no old favicon.png', () => {
    const size = (p: string) => {
      const b = readFileSync(pub(p))
      return [b.readUInt32BE(16), b.readUInt32BE(20), b[25]] as const // width, height, colour type
    }
    expect(size('/favicon-32.png').slice(0, 2)).toEqual([32, 32])
    expect(size('/icon-192.png').slice(0, 2)).toEqual([192, 192])
    expect(size('/icon-512.png').slice(0, 2)).toEqual([512, 512])
    const touch = size('/apple-touch-icon.png')
    expect(touch.slice(0, 2)).toEqual([180, 180])
    expect(touch[2]).toBe(2) // RGB, no alpha channel
    expect(existsSync(pub('/favicon.png'))).toBe(false)
  })

  it('draws the MJ monogram as paths, not text, and stays small', () => {
    const svg = readFileSync(pub('/favicon.svg'), 'utf8')
    expect(svg).toContain('#0b0b0c')
    expect(svg).toContain('#c6ff3d')
    expect(svg).not.toContain('<text')
    expect(svg).not.toContain('font-family')
    expect(Buffer.byteLength(svg)).toBeLessThan(10 * 1024)
  })
})

describe('structured data', () => {
  it('describes the approved positioning, not a Flutter-only developer', () => {
    expect(html).not.toContain('Flutter Developer')
    expect(html).toContain('"jobTitle": "Software Engineer"')
    expect(html).toMatch(/"description": "Software Engineer specializing in mobile apps/)
  })
})

describe('sitemap and robots', () => {
  const sitemap = readFileSync(pub('/sitemap.xml'), 'utf8')
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  it('lists exactly the real routes', () => {
    expect(urls).toHaveLength(8)
    expect([...urls].sort()).toEqual(routes.map((r) => `${SITE_URL}${r.path}`).sort())
  })

  it('does not list the not-found page', () => {
    expect(urls.some((u) => u.includes('404'))).toBe(false)
  })

  it('has robots.txt allowing crawling and pointing at the sitemap', () => {
    const robots = readFileSync(pub('/robots.txt'), 'utf8')
    expect(robots).toMatch(/User-agent: \*/)
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m)
  })
})
