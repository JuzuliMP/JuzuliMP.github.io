import { useEffect, useRef, useState, type AnchorHTMLAttributes } from 'react'
import { profile } from '../../content/profile'
import { cx } from '../../lib/cx'
import type { NavKey } from '../../lib/routes'
import { useHeaderVisibility } from '../../lib/useHeaderVisibility'
import { useMagnetic } from '../../lib/useMagnetic'
import { PillLink } from '../ui/PillLink'
import { useSound, useSoundEvents } from './SoundProvider'

export const NAV_ITEMS: { key: NavKey; label: string; sub: string; href: string }[] = [
  { key: 'home', label: 'Home', sub: 'Start here', href: '/' },
  { key: 'about', label: 'About', sub: 'The person', href: '/about/' },
  { key: 'work', label: 'Work', sub: 'Selected apps', href: '/work/' },
]

/** Anchor that plays the hover tick and the click sound (when sound is on). */
function SoundLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const sound = useSoundEvents()
  return <a {...props} {...sound} />
}

/** The "Let's talk" pill. It is a real mailto link; on a mouse it is pulled toward the pointer within ~80px. */
function TalkPill() {
  const ref = useRef<HTMLSpanElement>(null)
  useMagnetic(ref, { radius: 80, strength: 0.35 })
  return (
    <span ref={ref} className="inline-flex will-change-transform">
      <PillLink href={profile.emailHref} size="sm">
        Let's talk
      </PillLink>
    </span>
  )
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9h3l5-4v14l-5-4H4z" />
      {on ? (
        <>
          <path d="M16 9a4 4 0 0 1 0 6" />
          <path d="M19 6a8 8 0 0 1 0 12" />
        </>
      ) : (
        <>
          <path d="M16 9l5 6" />
          <path d="M21 9l-5 6" />
        </>
      )}
    </svg>
  )
}

const BAR_HEIGHTS = ['45%', '100%', '65%'] as const

/**
 * Three small bars that move while the score plays. Purely decorative
 * (aria-hidden); they stay still at fixed heights under reduced motion and
 * whenever nothing is playing. Animated with the Web Animations API so no
 * stylesheet is needed, and only after mount, so server and client markup match.
 */
function SoundBars({ playing }: { playing: boolean }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    if (!playing || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    let running: Animation[] = []
    const stop = () => {
      for (const a of running) a.cancel()
      running = []
    }
    const apply = () => {
      stop()
      if (query.matches) return
      bars.current.forEach((bar, i) => {
        if (!bar || typeof bar.animate !== 'function') return
        running.push(
          bar.animate([{ transform: 'scaleY(0.35)' }, { transform: 'scaleY(1)' }], {
            duration: 700 + i * 180,
            delay: i * -230,
            direction: 'alternate',
            iterations: Infinity,
            easing: 'ease-in-out',
          }),
        )
      })
    }
    apply()
    query.addEventListener?.('change', apply)
    return () => {
      query.removeEventListener?.('change', apply)
      stop()
    }
  }, [playing])

  return (
    <span aria-hidden="true" data-sound-bars={playing ? 'playing' : 'idle'} className="flex h-3 items-end gap-[2px]">
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el
          }}
          className="block w-[2px] origin-bottom rounded-full bg-current"
          style={{ height }}
        />
      ))}
    </span>
  )
}

function SoundToggle({ className = '', withIcon = true }: { className?: string; withIcon?: boolean }) {
  const { enabled, playing, toggle } = useSound()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className={cx(
        'mono-label-sm items-center gap-2 rounded-full border bg-transparent transition-colors duration-150',
        enabled
          ? 'border-lime text-lime'
          : 'border-line-medium text-mute hover:border-paper hover:text-paper',
        className,
      )}
    >
      {withIcon ? <SpeakerIcon on={enabled} /> : null}
      <span>{enabled ? 'Sound on' : 'Sound off'}</span>
      {enabled ? <SoundBars playing={playing} /> : null}
    </button>
  )
}

export function SiteHeader({ active }: { active: NavKey | null }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const keyboard = useRef(false)
  const { hidden, scrolled } = useHeaderVisibility()

  // The header stays put while the menu is open and while keyboard focus is inside it.
  const show = !hidden || menuOpen || focusInside

  // Only keyboard focus keeps the header open: clicking a button with the mouse must not pin it.
  useEffect(() => {
    const onKey = () => {
      keyboard.current = true
    }
    const onPointer = () => {
      keyboard.current = false
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer, true)
    }
  }, [])

  // Escape closes the sheet and returns focus to the Menu button. The sheet also
  // locks page scroll while it is open.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  return (
    <header
      data-header
      data-hidden={show ? undefined : ''}
      onFocus={() => {
        if (keyboard.current) setFocusInside(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false)
      }}
      className="pointer-events-none sticky top-0 z-50 w-full text-paper"
    >
      <div
        data-header-bar
        className={cx(
          'pointer-events-auto relative z-10 border-b transition-[translate,background-color,border-color,backdrop-filter] duration-300 ease-out',
          show ? 'translate-y-0' : '-translate-y-full',
          scrolled && !menuOpen
            ? 'border-line bg-ink/80 backdrop-blur-md backdrop-saturate-150 supports-[not(backdrop-filter:blur(1px))]:bg-ink/95'
            : 'border-transparent',
        )}
      >
        <div className="page-container flex items-center justify-between gap-4 py-[18px] md:gap-6 md:py-7">
          <SoundLink href="/" className="flex flex-col gap-[3px] text-paper no-underline md:gap-1">
            <span className="text-base font-medium tracking-[-0.01em] md:text-[17px]">
              {profile.shortName}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute md:text-[11px]">
              {profile.title}
            </span>
          </SoundLink>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden items-center gap-12 md:flex">
            {NAV_ITEMS.map((item) => {
              const on = item.key === active
              return (
                <SoundLink
                  key={item.key}
                  href={item.href}
                  aria-current={on ? 'page' : undefined}
                  className={cx(
                    'group flex items-start gap-2.5 no-underline transition-colors duration-150',
                    on ? 'text-paper' : 'text-soft hover:text-paper',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      'mt-2 h-1.5 w-1.5 rounded-full border transition-colors duration-150',
                      on ? 'border-lime bg-lime' : 'border-mute bg-transparent group-hover:border-paper',
                    )}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-[17px] font-medium">{item.label}</span>
                    <span className="mono-label-sm">{item.sub}</span>
                  </span>
                </SoundLink>
              )
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <SoundToggle className="flex min-h-11 cursor-pointer px-3.5" />
            <TalkPill />
          </div>

          {/* Mobile menu button */}
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="mono-label-sm flex min-h-11 min-w-11 cursor-pointer items-center gap-2.5 rounded-full border border-paper/25 bg-transparent px-4 text-paper md:hidden"
          >
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="block h-px w-3.5 bg-paper" />
              <span className={`block h-px w-3.5 ${menuOpen ? 'bg-lime' : 'bg-paper'}`} />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-menu"
          data-lenis-prevent
          className="pointer-events-auto fixed inset-0 z-0 flex flex-col gap-7 overflow-y-auto bg-ink px-5 pb-8 pt-24 md:hidden"
        >
          <nav aria-label="Main" className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const on = item.key === active
              return (
                <SoundLink
                  key={item.key}
                  href={item.href}
                  aria-current={on ? 'page' : undefined}
                  className="flex items-baseline justify-between border-b border-line py-[18px] text-paper no-underline transition-colors duration-150 hover:text-lime"
                >
                  <span className="text-[44px] font-light tracking-[-0.04em]">{item.label}</span>
                  <span className="mono-label-sm">{item.sub}</span>
                </SoundLink>
              )
            })}
          </nav>
          <PillLink href={profile.emailHref} variant="lime" size="lg" className="w-full">
            Let's talk
          </PillLink>
          <SoundToggle className="flex min-h-12 cursor-pointer justify-center" withIcon={false} />
          <nav aria-label="Social links" className="mono-label-sm mt-auto flex gap-6">
            {profile.socials.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-soft no-underline transition-colors duration-150 hover:text-lime"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
