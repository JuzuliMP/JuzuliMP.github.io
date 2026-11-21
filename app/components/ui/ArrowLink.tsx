import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { externalProps, isExternal, stripArrow } from '../../lib/links'
import { useSoundEvents } from '../layout/SoundProvider'

type ArrowLinkProps = {
  href: string
  /** `back` puts a `←` before the text; `forward` puts `→` (or `↗` for external URLs) after it. */
  direction?: 'forward' | 'back'
  /** `paper` (default) or the quieter `soft`. */
  tone?: 'paper' | 'soft'
  className?: string
  children: ReactNode
}

/** Mono text link with an arrow ("All articles on Medium ↗", "← All work"). Turns lime on hover. */
export function ArrowLink({ href, direction = 'forward', tone = 'paper', className, children }: ArrowLinkProps) {
  const sound = useSoundEvents()
  const arrow = direction === 'back' ? '←' : isExternal(href) ? '↗' : '→'
  const arrowEl = (
    <span aria-hidden="true" className={direction === 'back' ? 'mr-2' : 'ml-2'}>
      {arrow}
    </span>
  )
  return (
    <a
      href={href}
      {...sound}
      className={cx(
        'mono-label inline-flex min-h-11 items-center no-underline transition-colors duration-150 hover:text-lime',
        tone === 'soft' ? 'text-soft' : 'text-paper',
        className,
      )}
      {...externalProps(href)}
    >
      {direction === 'back' ? arrowEl : null}
      {stripArrow(children)}
      {direction === 'forward' ? arrowEl : null}
    </a>
  )
}
