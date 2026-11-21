import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type MonoLabelTone = 'mute' | 'soft' | 'paper' | 'lime'

type MonoLabelProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** Element to render. Defaults to a `p`. */
  as?: 'p' | 'span' | 'div' | 'h2' | 'h3' | 'dt' | 'dd'
  /** Text colour token. Defaults to `mute`. */
  tone?: MonoLabelTone
  /** `md` is 12px / 0.14em, `sm` is 11px / 0.12em. */
  size?: 'md' | 'sm'
  children: ReactNode
}

const TONE: Record<MonoLabelTone, string> = {
  mute: '',
  soft: 'text-soft',
  paper: 'text-paper',
  lime: 'text-lime',
}

/** Small uppercase JetBrains Mono label (eyebrows, meta, dates). */
export function MonoLabel({
  as: Tag = 'p',
  tone = 'mute',
  size = 'md',
  className,
  children,
  ...rest
}: MonoLabelProps) {
  return (
    <Tag
      className={cx('m-0', size === 'sm' ? 'mono-label-sm' : 'mono-label', TONE[tone], className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
