import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import type { Experience } from '../../content/types'
import { externalProps } from '../../lib/links'
import { cx } from '../../lib/cx'
import { passedFlags, sameFlags } from './timeline'

/**
 * Experience list. A dot fills lime once its row's top has passed ~60% of the
 * viewport height, and empties again when scrolled back (scroll-linked).
 *
 * Rest state (server HTML, no JS, reduced motion) is the mockup's: only the
 * current role's dot is filled. Reduced motion keeps it there instead of
 * filling every dot, so the one lime dot keeps meaning "this is the role I
 * hold now" and nothing moves with scroll.
 */
export function ExperienceTimeline({ items }: { items: readonly Experience[] }) {
  const reduce = useReducedMotion()
  const rows = useRef<Array<HTMLLIElement | null>>([])
  const [passed, setPassed] = useState<boolean[]>([])

  useEffect(() => {
    if (reduce) {
      setPassed([])
      return
    }
    let frame = 0
    const measure = () => {
      frame = 0
      const tops = rows.current.map((el) => (el ? el.getBoundingClientRect().top : Infinity))
      const next = passedFlags(tops, window.innerHeight)
      setPassed((prev) => (sameFlags(prev, next) ? prev : next))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduce])

  return (
    <ol className="m-0 list-none border-b border-line p-0">
      {items.map((job, i) => {
        const filled = job.current || (!reduce && passed[i] === true)
        return (
          <li
            key={job.period}
            ref={(el) => {
              rows.current[i] = el
            }}
            className="flex flex-col gap-3.5 border-t border-line py-8 md:flex-row md:gap-10"
          >
            <div className="flex items-center gap-3 md:w-[280px] md:flex-none">
              <span
                aria-hidden="true"
                data-filled={filled ? 'true' : 'false'}
                className={cx(
                  'box-border h-2.5 w-2.5 flex-none rounded-full border transition-colors duration-300',
                  filled ? 'border-lime bg-lime' : 'border-mute bg-transparent',
                )}
              />
              <span
                className={cx(
                  'font-mono text-xs uppercase tracking-[0.1em]',
                  job.current ? 'text-paper' : 'text-soft',
                )}
              >
                {job.period}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <h3 className="m-0 text-h3">{job.role}</h3>
              <p className="m-0 font-mono text-xs uppercase tracking-[0.1em] text-mute">
                <a
                  href={job.companyUrl}
                  className="text-paper no-underline transition-colors duration-150 hover:text-lime"
                  {...externalProps(job.companyUrl)}
                >
                  {job.company}
                </a>{' '}
                · {job.location}
              </p>
              <p className="m-0 text-body text-soft">{job.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
