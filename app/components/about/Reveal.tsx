import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useInView } from 'motion/react'

type RevealProps = {
  as?: ElementType
  className?: string
  /** Stagger delay in milliseconds. */
  delay?: number
  children: ReactNode
}

/**
 * Fades and lifts its content once it enters the viewport. The hidden state is
 * CSS-only and scoped to `html.js` (see AboutMotionStyles), so without JS, or
 * with reduced motion, the content is simply there.
 */
export function Reveal({ as: Element = 'div', className, delay = 0, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const style = delay ? ({ '--d': `${delay}ms` } as CSSProperties) : undefined
  return (
    <Element ref={ref} className={`about-reveal${className ? ` ${className}` : ''}`} data-in={inView ? 'true' : 'false'} style={style}>
      {children}
    </Element>
  )
}
