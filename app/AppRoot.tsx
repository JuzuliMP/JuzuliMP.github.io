import { PageShell } from './components/layout/PageShell'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProjectPage } from './pages/ProjectPage'
import { WorkPage } from './pages/WorkPage'
import { activeNav, type Route } from './lib/routes'

function Page({ route }: { route: Route }) {
  switch (route.kind) {
    case 'home':
      return <HomePage />
    case 'about':
      return <AboutPage />
    case 'work':
      return <WorkPage />
    case 'project':
      return <ProjectPage slug={route.slug} />
    default:
      return <NotFoundPage />
  }
}

/** Renders one route inside the shared shell. Used by both prerender and the browser entry. */
export function AppRoot({ route }: { route: Route }) {
  return (
    <PageShell active={activeNav(route)}>
      <Page route={route} />
    </PageShell>
  )
}
