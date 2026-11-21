import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { externalProps, isExternal, stripArrow } from '../../lib/links'
import { useSoundEvents } from '../layout/SoundProvider'

type PillLinkProps = {
  href: string
  /** `outline` paper border, `lime` filled accent, `chip` small mono pill (social links). */
  variant?: 'outline' | 'lime' | 'chip'
  /** Height / padding: `sm` 44px, `md` 48px, `lg` 52px. Ignored by `chip`. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

const BASE =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full border no-underline transition-colors duration-150'

const VARIANT = {
  outline: 'border-paper text-paper hover:border-lime hover:bg-lime hover:text-ink',
  lime: 'border-lime bg-lime text-ink hover:border-paper hover:bg-paper',
  chip: 'mono-label min-h-11 border-line-strong px-[18px] text-paper hover:border-lime hover:bg-lime hover:text-ink',
} as const

const SIZE = {
  sm: 'min-h-11 px-[22px] text-[15px] font-medium',
  md: 'min-h-12 px-6 text-[15px] font-medium',
  lg: 'min-h-[52px] px-7 text-base font-medium',
} as const

/** Pill-shaped link. External URLs open in a new tab and get a `↗` (a trailing arrow already in a string label is dropped). Hover fills lime in 150ms. */
export function PillLink({ href, variant = 'outline', size = 'md', className, children }: PillLinkProps) {
  const external = isExternal(href)
  const sound = useSoundEvents()
  return (
    <a
      href={href}
      {...sound}
      className={cx(BASE, VARIANT[variant], variant !== 'chip' && SIZE[size], className)}
      {...externalProps(href)}
    >
      {stripArrow(children)}
      {external ? (
        <span aria-hidden="true" className="ml-1.5">
          ↗
        </span>
      ) : null}
    </a>
  )
}
