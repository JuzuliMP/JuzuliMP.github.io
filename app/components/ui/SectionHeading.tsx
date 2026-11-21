import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

type SectionHeadingProps = {
  id?: string
  /** Heading level. Defaults to `h2`. */
  as?: 'h2' | 'h3'
  /** `lime` for case-study sections, `mute` for quieter eyebrows. */
  tone?: 'lime' | 'mute'
  /** Optional count or number shown after the label, e.g. "05" or "001". */
  count?: string | number
  className?: string
  children: ReactNode
}

/** Mono-label section heading with an optional count. */
export function SectionHeading({
  id,
  as: Tag = 'h2',
  tone = 'lime',
  count,
  className,
  children,
}: SectionHeadingProps) {
  return (
    <Tag id={id} className={cx('mono-label m-0 font-medium', tone === 'lime' && 'text-lime', className)}>
      {children}
      {count !== undefined ? <span className="ml-3 text-mute">{count}</span> : null}
    </Tag>
  )
}
