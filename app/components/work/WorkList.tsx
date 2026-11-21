import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { cx } from '../../lib/cx'
import type { ProjectEntry } from '../../content/projects'
import { useSoundEvents } from '../layout/SoundProvider'
import { CursorPreview } from './CursorPreview'
import { PREVIEW_SIZE, easePoint, isSettled, placePreview, type Point } from './previewMotion'

type WorkListProps = {
  projects: readonly ProjectEntry[]
  /** Label on the preview chip ("View case →"). */
  hoverChip: string
}

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const ROW_STAGGER_MS = 90

/**
 * The numbered Work list. Every row is one link. With a mouse, a larger cover
 * follows the cursor; with keyboard focus the row gets the same title/number
 * treatment but no floating preview; on touch and with reduced motion there is
 * no floating preview at all. Rows fade up in sequence on load (only while
 * `html.js` is set, so prerendered HTML is fully visible without JavaScript).
 */
export function WorkList({ projects, hoverChip }: WorkListProps) {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [ready, setReady] = useState(false)
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const sound = useSoundEvents()

  const previewRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<Point>({ x: 0, y: 0 })
  const position = useRef<Point>({ x: 0, y: 0 })

  useEffect(() => {
    setReady(true)
  }, [])

  // The preview exists only for a mouse-like pointer and when motion is allowed.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const pointerQuery = window.matchMedia(FINE_POINTER)
    const motionQuery = window.matchMedia(REDUCED_MOTION)
    const update = () => {
      setReduceMotion(motionQuery.matches)
      setPreviewEnabled(pointerQuery.matches && !motionQuery.matches)
    }
    update()
    pointerQuery.addEventListener?.('change', update)
    motionQuery.addEventListener?.('change', update)
    return () => {
      pointerQuery.removeEventListener?.('change', update)
      motionQuery.removeEventListener?.('change', update)
    }
  }, [])

  function target(): Point {
    return placePreview(pointer.current, PREVIEW_SIZE, {
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }

  function paint() {
    const el = previewRef.current
    if (el) el.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`
  }

  // Ease the preview toward the pointer while a row is hovered.
  useEffect(() => {
    if (!previewEnabled || active === null) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const goal = target()
      if (!isSettled(position.current, goal)) {
        position.current = easePoint(position.current, goal, dt)
        paint()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // `target` and `paint` only read refs and window; the loop restarts per hovered row.
  }, [previewEnabled, active])

  function handleEnter(event: ReactPointerEvent<HTMLAnchorElement>, index: number) {
    sound.onPointerEnter?.(event)
    if (!previewEnabled || event.pointerType === 'touch') return
    pointer.current = { x: event.clientX, y: event.clientY }
    if (active === null) {
      // Appear next to the pointer instead of flying in from the last position.
      position.current = target()
      paint()
    }
    setActive(index)
  }

  function handleMove(event: ReactPointerEvent<HTMLOListElement>) {
    if (event.pointerType === 'touch') return
    pointer.current = { x: event.clientX, y: event.clientY }
  }

  return (
    <>
      <ol
        className="m-0 list-none p-0"
        onPointerMove={handleMove}
        onPointerLeave={() => setActive(null)}
      >
        {projects.map((p, i) => {
          const dimmed = previewEnabled && active === i
          return (
            <li
              key={p.slug}
              data-work-row=""
              className={cx(
                'transition-[opacity,translate] duration-700 ease-out',
                !ready && '[html.js_&]:translate-y-6 [html.js_&]:opacity-0',
              )}
              style={{ transitionDelay: ready || reduceMotion ? '0ms' : `${i * ROW_STAGGER_MS}ms` }}
            >
              <a
                href={`/work/${p.slug}/`}
                aria-labelledby={`work-title-${p.slug} work-tagline-${p.slug}`}
                onPointerEnter={(e) => handleEnter(e, i)}
                onClick={sound.onClick}
                className={cx(
                  'group flex flex-col items-start justify-between gap-7 border-t border-line py-6 text-paper no-underline',
                  'transition-colors duration-200 hover:border-lime focus-visible:border-lime md:items-center md:py-9',
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse',
                  i === projects.length - 1 && 'border-b',
                )}
              >
                <span className="flex min-w-0 flex-col gap-2.5 transition-transform duration-300 ease-out md:group-hover:translate-x-6 md:group-focus-visible:translate-x-6">
                  <span className="flex items-start gap-3">
                    <span id={`work-title-${p.slug}`} className="text-row-lg">
                      {p.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-2 font-mono text-xs text-mute transition-colors duration-200 group-hover:text-lime group-focus-visible:text-lime"
                    >
                      {p.number}
                    </span>
                  </span>
                  <span
                    id={`work-tagline-${p.slug}`}
                    className="mono-label tracking-[0.12em] transition-colors duration-200 group-hover:text-soft group-focus-visible:text-soft"
                  >
                    {p.tagline}
                  </span>
                </span>
                <img
                  src={p.cover.src}
                  alt={p.cover.listAlt}
                  width={p.cover.width}
                  height={p.cover.height}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className={cx(
                    'h-[190px] w-[350px] max-w-full flex-none rounded-card object-cover transition-opacity duration-300 md:h-[180px] md:w-[300px]',
                    dimmed && 'opacity-30',
                  )}
                />
              </a>
            </li>
          )
        })}
      </ol>
      {previewEnabled ? (
        <CursorPreview
          ref={previewRef}
          active={active}
          chip={hoverChip}
          items={projects.map((p) => ({
            slug: p.slug,
            src: p.cover.src,
            width: p.cover.width,
            height: p.cover.height,
          }))}
        />
      ) : null}
    </>
  )
}
