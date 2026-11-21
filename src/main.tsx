import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { AppRoot } from '../app/AppRoot'
import { ROUTE_META_NAME, canHydrate, getRouteHead, resolveRoute } from '../app/lib/routes'
import '../styles/index.css'

const rootElement = document.getElementById('root')!
const route = resolveRoute(window.location.pathname)

const tree = (
  <StrictMode>
    <AppRoot route={route} />
  </StrictMode>
)

// Production pages are prerendered, so hydrate the existing markup when it was
// built for this route. In dev there is none, and a host that serves another
// page's HTML for an unknown URL gives the wrong markup: render from scratch
// then, and set the title ourselves.
const prerenderedKey = document
  .querySelector<HTMLMetaElement>(`meta[name="${ROUTE_META_NAME}"]`)
  ?.getAttribute('content')

if (canHydrate(rootElement.hasChildNodes(), prerenderedKey, route)) {
  hydrateRoot(rootElement, tree)
} else {
  rootElement.replaceChildren()
  document.title = getRouteHead(route).title
  createRoot(rootElement).render(tree)
}
