import { profile } from '../content/profile'
import { projects, getProject } from '../content/projects'
import type { ProjectSlug } from '../content/types'

export const SITE_URL = 'https://juzulimp.github.io'
export const OG_IMAGE = `${SITE_URL}/images/og-banner.png`
/** Describes the 1200x630 card: name, role, place, on a dark field of particles with a lime dot. */
export const OG_IMAGE_ALT = `${profile.name}, ${profile.title} in Bangalore, India. Name in large light type with a lime full stop, over a field of small particles.`
export const SITE_NAME = `${profile.name} — Portfolio`
export const TWITTER_HANDLE = '@Juzuli_M_P'

export type NavKey = 'home' | 'about' | 'work'

export type Route =
  | { kind: 'home'; path: '/' }
  | { kind: 'about'; path: '/about/' }
  | { kind: 'work'; path: '/work/' }
  | { kind: 'project'; path: string; slug: ProjectSlug }
  | { kind: 'not-found'; path: '/404/' }

export type RouteHead = {
  title: string
  description: string
  canonical: string
  image: string
  imageAlt: string
  /** False for pages that must not be indexed (not-found). */
  index: boolean
}

export type HeadElement = {
  type: 'meta' | 'link'
  props: Record<string, string>
}

export const notFoundRoute: Route = { kind: 'not-found', path: '/404/' }

/** Every indexable route, in sitemap order. Does not include not-found. */
export const routes: Route[] = [
  { kind: 'home', path: '/' },
  { kind: 'about', path: '/about/' },
  { kind: 'work', path: '/work/' },
  ...projects.map((p): Route => ({ kind: 'project', path: `/work/${p.slug}/`, slug: p.slug })),
]

/** Normalise a pathname for matching: leading slash, no `index.html`, no trailing slash. */
function normalise(pathname: string): string {
  let p = pathname.split('#')[0].split('?')[0]
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/index\.html$/, '/')
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p
}

export function resolveRoute(pathname: string): Route {
  const p = normalise(pathname)
  const match = routes.find((r) => normalise(r.path) === p)
  return match ?? notFoundRoute
}

/** The header nav item that should be marked as current for a route, if any. */
/** Name of the `<meta>` the prerender writes so the browser knows which route the HTML was built for. */
export const ROUTE_META_NAME = 'app-route'

/** Stable key for a route, e.g. `home` or `project:ychat`. */
export function routeKey(route: Route): string {
  return route.kind === 'project' ? `project:${route.slug}` : route.kind
}

/**
 * Hydrate only when the page holds prerendered markup *for this route*. A
 * host that falls back to another page's HTML for unknown URLs (an SPA
 * fallback, a mis-served file) must render from scratch instead, or React
 * throws hydration errors and keeps the wrong page's title.
 */
export function canHydrate(hasMarkup: boolean, prerenderedKey: string | null | undefined, route: Route): boolean {
  return hasMarkup && prerenderedKey === routeKey(route)
}

export function activeNav(route: Route): NavKey | null {
  switch (route.kind) {
    case 'home':
    case 'about':
    case 'work':
      return route.kind
    case 'project':
      return 'work'
    default:
      return null
  }
}

const HOME_DESCRIPTION =
  'Mohammed Juzuli M P is a Software Engineer in Bangalore who designs, builds and ships cross-platform mobile apps with Flutter, Swift and Kotlin.'
const ABOUT_DESCRIPTION =
  'About Mohammed Juzuli M P: an app developer and UI/UX designer in Bangalore with experience at YACHII, CoinedOne and NDimensionZ.'
const WORK_DESCRIPTION =
  'Five mobile apps designed, built and shipped between 2022 and 2026, from the YChat social platform to Superr parental controls and Ablemart grocery delivery.'
const NOT_FOUND_DESCRIPTION =
  'The page you are looking for does not exist. Head back to the home page or browse the selected apps.'

export function getRouteHead(route: Route): RouteHead {
  const base = {
    canonical: `${SITE_URL}${route.path}`,
    image: OG_IMAGE,
    imageAlt: OG_IMAGE_ALT,
    index: true,
  }
  switch (route.kind) {
    case 'home':
      return { ...base, title: `${profile.name} · ${profile.title}`, description: HOME_DESCRIPTION }
    case 'about':
      return { ...base, title: `About · ${profile.name}`, description: ABOUT_DESCRIPTION }
    case 'work':
      return { ...base, title: `Selected apps · ${profile.name}`, description: WORK_DESCRIPTION }
    case 'project': {
      const project = getProject(route.slug)
      if (!project) throw new Error(`Unknown project: ${route.slug}`)
      return { ...base, title: `${project.name} · case study`, description: project.metaDescription }
    }
    default:
      return {
        ...base,
        title: 'Page not found',
        description: NOT_FOUND_DESCRIPTION,
        index: false,
      }
  }
}

/** Head elements (besides `<title>`) in the format vite-prerender-plugin expects. */
export function getHeadElements(route: Route): HeadElement[] {
  const h = getRouteHead(route)
  const meta = (attr: 'name' | 'property', key: string, content: string): HeadElement => ({
    type: 'meta',
    props: { [attr]: key, content },
  })
  return [
    meta('name', 'description', h.description),
    meta('name', 'robots', h.index ? 'index, follow' : 'noindex, follow'),
    ...(h.index ? [{ type: 'link', props: { rel: 'canonical', href: h.canonical } } as HeadElement] : []),
    meta('property', 'og:type', 'website'),
    ...(h.index ? [meta('property', 'og:url', h.canonical)] : []),
    meta('property', 'og:title', h.title),
    meta('property', 'og:description', h.description),
    meta('property', 'og:image', h.image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', h.imageAlt),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:locale', 'en_US'),
    meta('name', 'twitter:card', 'summary_large_image'),
    ...(h.index ? [meta('name', 'twitter:url', h.canonical)] : []),
    meta('name', 'twitter:title', h.title),
    meta('name', 'twitter:description', h.description),
    meta('name', 'twitter:image', h.image),
    meta('name', 'twitter:image:alt', h.imageAlt),
    meta('name', 'twitter:creator', TWITTER_HANDLE),
  ]
}
