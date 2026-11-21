import { cx } from '../../lib/cx'
import type { ProjectEntry } from '../../content/projects'
import { projectPage } from '../../content/projects'
import { Reveal } from './Reveal'

const GRID_COLS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

/**
 * Store screenshots. From md up: an equal-column grid (3 or 4 columns). Below
 * md: a horizontal scroll-snap strip whose next card peeks in, with a thin
 * visible scrollbar and a "Swipe for more" hint. The strip is keyboard
 * focusable so it can be scrolled with the arrow keys.
 */
export function ScreenshotStrip({ project }: { project: ProjectEntry }) {
  const shots = project.screenshots
  return (
    <section
      aria-labelledby="project-screenshots"
      className="page-container pb-[72px] md:pb-[120px]"
    >
      <h2 id="project-screenshots" className="sr-only">
        {projectPage.screenshotsLabel}
      </h2>
      <div
        role="group"
        aria-label={`${project.name} ${projectPage.screenshotsLabel.toLowerCase()}`}
        tabIndex={0}
        data-screenshot-strip=""
        className={cx(
          '-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-4 [scroll-padding-inline:20px]',
          '[scrollbar-color:var(--color-lime)_var(--color-line)] [scrollbar-width:thin]',
          'md:mx-0 md:grid md:snap-none md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:[scroll-padding-inline:0]',
          GRID_COLS[shots.length] ?? 'md:grid-cols-3',
        )}
      >
        {shots.map((shot, i) => (
          <Reveal
            as="figure"
            key={shot.src}
            delay={i * 80}
            lift="sm"
            className="m-0 flex w-[58%] flex-none snap-start flex-col gap-3 md:w-auto"
          >
            <img
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full rounded-card bg-surface"
            />
            <figcaption className="mono-label-sm">{shot.caption}</figcaption>
          </Reveal>
        ))}
      </div>
      {shots.length > 1 ? (
        <p aria-hidden="true" className="mono-label-sm m-0 mt-2 md:hidden">
          {projectPage.screenshotsHint} →
        </p>
      ) : null}
    </section>
  )
}
