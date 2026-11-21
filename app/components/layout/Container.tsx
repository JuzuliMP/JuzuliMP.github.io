import type { ElementType, ReactNode } from 'react'
import { cx } from '../../lib/cx'

type ContainerProps = {
  as?: ElementType
  className?: string
  children: ReactNode
  [key: string]: unknown
}

/** Centred page container: the `page-container` utility (max 1440px, 20px side padding, 40px from md up). */
export function Container({ as: Tag = 'div', className, children, ...rest }: ContainerProps) {
  return (
    <Tag className={cx('page-container', className)} {...rest}>
      {children}
    </Tag>
  )
}
