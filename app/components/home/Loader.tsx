import { useEffect, useState } from 'react'
import { cx } from '../../lib/cx'
import { MonoLabel } from '../ui/MonoLabel'
import type { HomeLoaderCopy } from '../../content/home'
import {
  LOADER_ELEMENT_ID,
  LOADER_REVEAL_SCRIPT,
  LOAD_TASKS,
  completeLoadTask,
  completedLoadTasks,
  loaderFailsafeFired,
  markLoaderDone,
  rememberLoader,
  shouldShowLoader,
} from './loaderGate'

/** The count never reaches 100 before this. */
export const LOADER_MIN_MS = 800
/** Everything is forced to 100 by here, even if a task hangs. */
export const LOADER_MAX_MS = 3000
/** From here the count is pulled to 100 whatever is still pending, so it can finish by LOADER_MAX_MS. */
const FORCE_FROM_MS = 2400
const FADE_MS = 450
const REDUCED_FADE_MS = 150
const REDUCED_MIN_MS = 300
const TICK_MS = 33
/** Where the count heads while 0, 1 or 2 of the 3 load tasks are done. */
const TARGETS = [18, 48, 78]

type Phase = 'boot' | 'running' | 'leaving' | 'done'

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Full-screen loader for the Home page, once per tab session.
 *
 * The prerendered HTML contains this element with the `hidden` attribute, so
 * visitors without JavaScript never see it. A tiny inline script right inside
 * it removes `hidden` during parsing on a first visit (nothing stored in
 * sessionStorage yet), so the loader is there from the first paint with no
 * flash of the page. Hydration then keeps the same markup; `hidden` is the one
 * attribute the script changes, hence `suppressHydrationWarning` on that element.
 * On a return visit the element stays hidden and is removed on mount.
 */
export function Loader({ content }: { content: HomeLoaderCopy }) {
  const [phase, setPhase] = useState<Phase>('boot')
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!shouldShowLoader() || loaderFailsafeFired()) {
      // A return visit, or the app mounted so late that the failsafe already
      // hid the loader and the page is being read: do not pop it up now.
      if (loaderFailsafeFired()) rememberLoader()
      setPhase('done')
      markLoaderDone()
      return
    }
    setPhase('running')
    setValue(0)

    const reduced = prefersReducedMotion()
    const startedAt = Date.now()
    let current = 0
    let shown = 0
    let finished = false
    let fadeTimer: ReturnType<typeof setTimeout> | undefined

    // Real work: fonts. (The scene reports the three.js chunk and its first frame.)
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts?.ready) fonts.ready.then(() => completeLoadTask('fonts'), () => completeLoadTask('fonts'))
    else completeLoadTask('fonts')

    const finish = () => {
      if (finished) return
      finished = true
      clearInterval(interval)
      setValue(100)
      rememberLoader()
      markLoaderDone() // the hero starts rising as the overlay fades
      setPhase('leaving')
      fadeTimer = setTimeout(() => setPhase('done'), reduced ? REDUCED_FADE_MS : FADE_MS)
    }

    const tick = () => {
      const elapsed = Date.now() - startedAt
      const allDone = completedLoadTasks() >= LOAD_TASKS.length
      if (reduced) {
        // No counting: show the finished state and fade shortly after the work is done.
        if (shown !== 100) {
          shown = 100
          setValue(100)
        }
        if ((allDone && elapsed >= REDUCED_MIN_MS) || elapsed >= LOADER_MAX_MS) finish()
        return
      }
      const forced = elapsed >= FORCE_FROM_MS
      const target = allDone || forced ? 100 : TARGETS[Math.min(completedLoadTasks(), TARGETS.length - 1)]!
      const ramp = Math.min(100, (elapsed / LOADER_MIN_MS) * 100)
      current = Math.min(current + Math.max((target - current) * 0.25, 0.4), target, ramp)
      if (target === 100 && current > 99 && elapsed >= LOADER_MIN_MS) current = 100
      const next = Math.floor(current)
      if (next !== shown) {
        shown = next
        setValue(next)
      }
      if (current >= 100 || elapsed >= LOADER_MAX_MS) finish()
    }

    const interval = setInterval(tick, TICK_MS)
    return () => {
      clearInterval(interval)
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      id={LOADER_ELEMENT_ID}
      data-phase={phase}
      hidden={phase === 'boot'}
      suppressHydrationWarning
      className={cx(
        'fixed inset-0 z-[100] flex flex-col justify-between bg-ink px-5 py-6 transition-opacity duration-[450ms] ease-out md:px-10 md:py-9',
        phase === 'leaving' && 'pointer-events-none opacity-0',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <MonoLabel tone="soft">{content.title}</MonoLabel>
        <MonoLabel>{content.soundNote}</MonoLabel>
      </div>
      <div
        role="progressbar"
        aria-label={content.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="flex flex-col gap-7"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <p className="m-0 flex items-start gap-2.5">
            <span className="text-[clamp(120px,15.3vw,220px)] font-light leading-[0.78] tracking-[-0.06em]">{value}</span>
            <span className="font-mono text-base text-lime">%</span>
          </p>
          <MonoLabel className="md:mb-2 md:text-right">{content.status}</MonoLabel>
        </div>
        <div className="h-px bg-line-strong">
          <div className="h-px origin-left bg-lime" style={{ transform: `scaleX(${value / 100})` }} />
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: LOADER_REVEAL_SCRIPT }} />
    </div>
  )
}
