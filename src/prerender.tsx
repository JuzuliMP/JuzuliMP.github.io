import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { AppRoot } from '../app/AppRoot'
import {
  type HeadElement,
  ROUTE_META_NAME,
  getHeadElements,
  getRouteHead,
  resolveRoute,
  routeKey,
  routes,
} from '../app/lib/routes'

/**
 * Called once per route by vite-prerender-plugin. `links` lists every route so
 * the plugin emits a page for each one; the not-found page is queued through
 * `additionalPrerenderRoutes` in vite.config.ts.
 */
export async function prerender(data: { url: string }) {
  const route = resolveRoute(data.url)
  const html = renderToString(
    <StrictMode>
      <AppRoot route={route} />
    </StrictMode>,
  )

  return {
    html,
    links: new Set(routes.map((r) => r.path)),
    head: {
      lang: 'en',
      title: getRouteHead(route).title,
      elements: new Set<HeadElement>([
        ...getHeadElements(route),
        { type: 'meta', props: { name: ROUTE_META_NAME, content: routeKey(route) } },
      ]),
    },
  }
}
