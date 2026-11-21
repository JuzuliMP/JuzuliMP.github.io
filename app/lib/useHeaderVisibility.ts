import { useEffect, useState } from 'react'
import { initialHeaderScroll, isScrolled, nextHeaderScroll } from './scrollDirection'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * Scroll state for the site header. `hidden` is true while the visitor scrolls
 * down past the first 80px and turns false on any scroll up; `scrolled` says
 * the page has left the top (the header then gets a solid background).
 *
 * Lenis drives the browser's native scroll, so a passive `scroll` listener
 * throttled to one update per frame is enough.
 *
 * Reduced motion: the header simply stays visible (it never hides), so nothing
 * slides or flashes. The background still appears once scrolled.
 */
export function useHeaderVisibility(): { hidden: boolean; scrolled: boolean } {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION) : null
    let state = initialHeaderScroll(window.scrollY)
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      state = nextHeaderScroll(state, y)
      setHidden(state.hidden && !reduce?.matches)
      setScrolled(isScrolled(y))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    reduce?.addEventListener?.('change', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      reduce?.removeEventListener?.('change', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return { hidden, scrolled }
}
