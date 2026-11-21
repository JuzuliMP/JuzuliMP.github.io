import { createElement, useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { cx } from '../../lib/cx'

type RevealProps = {
  as?: 'div' | 'section' | 'li' | 'figure'
  className?: string
  /** Delay in ms before the reveal transition starts (for staggering siblings). */
  delay?: number
  /** `sm` lifts 12px (inside scroll containers, where a taller lift would add scroll), `md` 24px. */
  lift?: 'sm' | 'md'
  children: ReactNode
}

/**
 * Fades and lifts its children in the first time they scroll into view.
 * The hidden state is only applied under `html.js` (set in the document head),
 * so prerendered HTML and no-JS visitors see all content. With reduced motion,
 * or without IntersectionObserver, content is shown immediately.
 */
export function Reveal({ as = 'div', className, delay = 0, lift = 'md', children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduceMotion, shown])

  return createElement(
    as,
    {
      ref,
      'data-reveal': shown ? 'shown' : 'hidden',
      className: cx(
        'transition-[opacity,translate] duration-700 ease-out',
        !shown &&
          (lift === 'sm'
            ? '[html.js_&]:translate-y-3 [html.js_&]:opacity-0'
            : '[html.js_&]:translate-y-6 [html.js_&]:opacity-0'),
        className,
      ),
      style: delay && !reduceMotion ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  )
}
