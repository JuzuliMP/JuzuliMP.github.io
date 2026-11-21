import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { useLoaderGate } from './loaderGate'

/**
 * Text that rises out of a mask, one line after another (60ms apart).
 *
 * `RevealGroup` owns the trigger, `RevealLine` is one line. The styles live in
 * `home.css`. Content is always visible without JavaScript:
 *
 * - `scroll` groups render visible. After mount, a group that is still below
 *   the fold is hidden and revealed (once) when it scrolls into view.
 * - `hero` groups render in the "pending" state, which only hides them when
 *   `html.js` is set (and a CSS failsafe shows them after 8s regardless). They
 *   reveal when the loader has finished, or right away when it does not run.
 *
 * Reduced motion: `home.css` removes the offset and the transition, so
 * everything is simply there.
 */

export const REVEAL_STAGGER_MS = 60

type GroupState = 'idle' | 'pending' | 'in'

type RevealGroupProps = {
  as?: ElementType
  mode?: 'scroll' | 'hero'
  className?: string
  children: ReactNode
}

export function RevealGroup({ as: Tag = 'div', mode = 'scroll', className, children }: RevealGroupProps) {
  const ref = useRef<HTMLElement>(null)
  const gateOpen = useLoaderGate()
  const [state, setState] = useState<GroupState>(mode === 'hero' ? 'pending' : 'idle')

  // Hero: reveal once the loader is out of the way.
  useEffect(() => {
    if (mode === 'hero' && gateOpen) setState('in')
  }, [mode, gateOpen])

  // Scroll: arm (hide) when below the fold, then reveal once when it enters.
  useEffect(() => {
    if (mode !== 'scroll') return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) return // already on screen: leave it visible
    setState('pending')
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('in')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mode])

  return (
    <Tag ref={ref} data-reveal-mode={mode} data-reveal-state={state} className={className}>
      {children}
    </Tag>
  )
}

type RevealLineProps = {
  /** Position in the group; sets the stagger delay. */
  index: number
  /** Element for the line itself: `span` for masked text (put it inside your own heading / paragraph), `div` for fades. */
  as?: ElementType
  /**
   * `mask` (default) clips the line as it rises, for text. `fade` fades and
   * lifts it without a clip, for blocks with links (so focus rings are never cut).
   */
  kind?: 'mask' | 'fade'
  className?: string
  children: ReactNode
}

export function RevealLine({ index, as, kind = 'mask', className, children }: RevealLineProps) {
  const Tag: ElementType = as ?? (kind === 'fade' ? 'div' : 'span')
  const line = (
    <Tag
      className={cx('rv-line', kind === 'fade' ? 'rv-line-fade' : 'block', kind === 'fade' && className)}
      style={{ '--rv-i': index } as CSSProperties}
    >
      {children}
    </Tag>
  )
  if (kind === 'fade') return line
  return <span className={cx('rv-mask', className)}>{line}</span>
}
