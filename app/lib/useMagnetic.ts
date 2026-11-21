import { useEffect, type RefObject } from 'react'
import { magneticTarget, type Point } from './magnetic'

export const MAGNETIC_MEDIA = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Options = { radius?: number; strength?: number }

/**
 * Pulls the element toward the pointer while it is within `radius` px, and
 * springs it back when the pointer leaves. Only runs with a mouse-like pointer
 * and when the visitor has not asked for reduced motion; otherwise it does
 * nothing (the element stays an ordinary, still link).
 */
export function useMagnetic(ref: RefObject<HTMLElement>, { radius = 80, strength = 0.35 }: Options = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof window.matchMedia !== 'function') return
    const fine = window.matchMedia(MAGNETIC_MEDIA)
    const reduce = window.matchMedia(REDUCED_MOTION)
    if (!fine.matches || reduce.matches) return

    let pos: Point = { x: 0, y: 0 }
    let vel: Point = { x: 0, y: 0 }
    let goal: Point = { x: 0, y: 0 }
    let frame = 0
    let last = 0

    const paint = () => {
      el.style.transform =
        pos.x === 0 && pos.y === 0 ? '' : `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`
    }

    // Damped spring, integrated per frame (stiffness 220, damping 18).
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04)
      last = now
      for (const axis of ['x', 'y'] as const) {
        const force = (goal[axis] - pos[axis]) * 220 - vel[axis] * 18
        vel[axis] += force * dt
        pos[axis] += vel[axis] * dt
      }
      const settled =
        Math.abs(goal.x - pos.x) < 0.05 &&
        Math.abs(goal.y - pos.y) < 0.05 &&
        Math.abs(vel.x) < 0.05 &&
        Math.abs(vel.y) < 0.05
      if (settled) {
        pos = { ...goal }
        vel = { x: 0, y: 0 }
        paint()
        frame = 0
        return
      }
      paint()
      frame = requestAnimationFrame(tick)
    }

    const run = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = el.getBoundingClientRect()
      // Measure the un-shifted box so the target does not chase itself.
      const rect = { left: r.left - pos.x, top: r.top - pos.y, width: r.width, height: r.height }
      const next = magneticTarget(rect, { x: e.clientX, y: e.clientY }, radius, strength)
      if (next.x === goal.x && next.y === goal.y) return
      goal = next
      run()
    }

    const release = () => {
      goal = { x: 0, y: 0 }
      run()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', release)
      window.removeEventListener('blur', release)
      if (frame) cancelAnimationFrame(frame)
      el.style.transform = ''
    }
  }, [ref, radius, strength])
}
