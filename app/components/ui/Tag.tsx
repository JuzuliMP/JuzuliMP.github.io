import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

type TagProps = {
  /** Element to render; use `li` inside a `ul`. */
  as?: 'span' | 'li'
  className?: string
  children: ReactNode
}

/** Mono chip with a 4px radius and a hairline border (tech stack, chapter keywords). */
export function Tag({ as: Element = 'span', className, children }: TagProps) {
  return (
    <Element
      className={cx(
        'inline-block rounded-tag border border-line-medium px-3.5 py-2 font-mono text-label text-soft',
        className,
      )}
    >
      {children}
    </Element>
  )
}

/** A wrapping list of Tags. */
export function TagList({ tags, className }: { tags: readonly string[]; className?: string }) {
  return (
    <ul className={cx('m-0 flex list-none flex-wrap gap-2.5 p-0', className)}>
      {tags.map((t) => (
        <Tag as="li" key={t}>
          {t}
        </Tag>
      ))}
    </ul>
  )
}
