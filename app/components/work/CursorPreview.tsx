import { forwardRef } from 'react'
import { cx } from '../../lib/cx'
import { PREVIEW_SIZE } from './previewMotion'

type PreviewItem = { slug: string; src: string; width: number; height: number }

type CursorPreviewProps = {
  items: readonly PreviewItem[]
  /** Index of the hovered row, or null when the pointer is outside the list. */
  active: number | null
  chip: string
}

/**
 * Larger cover that follows the mouse over the Work list. Purely decorative:
 * hidden from assistive tech, never focusable, fixed-position (no layout
 * shift) and `pointer-events: none`. The parent moves it by writing
 * `transform` on the forwarded ref every frame.
 */
export const CursorPreview = forwardRef<HTMLDivElement, CursorPreviewProps>(function CursorPreview(
  { items, active, chip },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-cursor-preview=""
      className="pointer-events-none fixed left-0 top-0 z-40 will-change-transform"
      style={{ width: PREVIEW_SIZE.width, height: PREVIEW_SIZE.height }}
    >
      <div
        className={cx(
          'relative h-full w-full overflow-hidden rounded-card bg-surface transition-[opacity,scale] duration-300 ease-out',
          active === null ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
        )}
      >
        {items.map((item, i) => (
          <img
            key={item.slug}
            src={item.src}
            alt=""
            width={item.width}
            height={item.height}
            decoding="async"
            draggable={false}
            className={cx(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
              active === i ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        <span className="absolute bottom-4 left-4 inline-flex min-h-9 items-center rounded-full bg-lime px-3.5 font-mono text-label-sm uppercase text-ink">
          {chip}
        </span>
      </div>
    </div>
  )
})
