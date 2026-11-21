import type { ReactNode } from 'react'
import type { NavKey } from '../../lib/routes'
import { SmoothScroll } from '../SmoothScroll'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SoundProvider } from './SoundProvider'

export function PageShell({ active, children }: { active: NavKey | null; children: ReactNode }) {
  return (
    <SoundProvider>
      <SmoothScroll>
        <div className="min-h-screen bg-ink font-sans text-paper">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-ink"
          >
            Skip to content
          </a>
          <SiteHeader active={active} />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
      </SmoothScroll>
    </SoundProvider>
  )
}
