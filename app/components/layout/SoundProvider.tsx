import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createSoundEngine,
  readSoundPreference,
  writeSoundPreference,
  type SoundEngine,
  type SoundName,
} from '../../lib/sound'
import { SCORE_RESUME_FADE_IN } from '../../lib/ambient'
import type { SoundPlace } from '../../lib/sandSpace'

export type SoundContextValue = {
  enabled: boolean
  /** True while the background score is actually running (enabled, unlocked by a gesture, tab visible). */
  playing: boolean
  toggle: () => void
  /** Plays a UI sound. Does nothing while sound is off or before the first gesture has unlocked audio. */
  play: (name: SoundName) => void
  /** How much the particles are moving (0..1) and where, for the sand sound. Silent while sound is off or before the first gesture. */
  motion: (level: number, place?: SoundPlace) => void
}

const SoundContext = createContext<SoundContextValue>({
  enabled: false,
  playing: false,
  toggle: () => {},
  play: () => {},
  motion: () => {},
})

/** Any of these counts as the user gesture that lets the browser start audio. */
const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchend'] as const

/**
 * Site-wide sound preference, player and background score. Sound is on by
 * default and the visitor's choice is remembered in localStorage. The stored
 * choice is read in an effect, so the prerendered HTML and the first client
 * render agree ("Sound on") and a saved "off" is applied right after hydration.
 *
 * Browsers refuse audio until a gesture, so nothing is created at load: the
 * first pointerdown, keydown or touchend anywhere starts the AudioContext (and
 * the score), then those listeners are removed. Switching sound off fades
 * everything out in 0.2 s and suspends the context; a hidden tab does the same
 * and resumes when it comes back.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true)
  const [playing, setPlaying] = useState(false)
  const enabledRef = useRef(true)
  const engineRef = useRef<SoundEngine | null>(null)
  const detachGesture = useRef<(() => void) | null>(null)
  const engine = () => (engineRef.current ??= createSoundEngine())

  /** Unlocks audio (from a gesture) and starts the score if the tab is visible. */
  const begin = useCallback((): boolean => {
    const e = engine()
    if (!e.unlock()) return false
    if (!document.hidden) {
      e.startScore()
      setPlaying(true)
    }
    void e.whenRunning().then((running) => {
      if (running) detachGesture.current?.()
    })
    return true
  }, [])

  useEffect(() => {
    const saved = readSoundPreference()
    enabledRef.current = saved
    if (!saved) setEnabled(false)

    const onGesture = () => {
      if (enabledRef.current) begin()
    }
    const detach = () => {
      for (const e of GESTURE_EVENTS) window.removeEventListener(e, onGesture)
      detachGesture.current = null
    }
    if (saved) {
      for (const e of GESTURE_EVENTS) window.addEventListener(e, onGesture, { passive: true })
      detachGesture.current = detach
    }

    const onVisibility = () => {
      const current = engineRef.current
      if (!current) return
      if (document.hidden) {
        current.stopScore()
        setPlaying(false)
      } else if (enabledRef.current && current.ready()) {
        current.startScore(SCORE_RESUME_FADE_IN)
        setPlaying(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      detach()
      document.removeEventListener('visibilitychange', onVisibility)
      engineRef.current?.close()
      engineRef.current = null
    }
  }, [begin])

  const toggle = useCallback(() => {
    const next = !enabledRef.current
    enabledRef.current = next
    setEnabled(next)
    writeSoundPreference(next)
    if (next) {
      if (begin()) engine().play('toggle')
    } else {
      engineRef.current?.stopScore()
      setPlaying(false)
    }
  }, [begin])

  const play = useCallback((name: SoundName) => {
    if (!enabledRef.current) return
    engineRef.current?.play(name)
  }, [])

  const motion = useCallback((level: number, place?: SoundPlace) => {
    if (!enabledRef.current || document.hidden) return
    engineRef.current?.motion(level, place)
  }, [])

  const value = useMemo(() => ({ enabled, playing, toggle, play, motion }), [enabled, playing, toggle, play, motion])
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound(): SoundContextValue {
  return useContext(SoundContext)
}

/**
 * Event props that play the hover tick (mouse pointers only) and the click
 * sound. Spread them on a link or button.
 */
export function useSoundEvents(hover = true) {
  const { play } = useSound()
  return useMemo(
    () => ({
      onPointerEnter: hover
        ? (e: { pointerType?: string }) => {
            if (e.pointerType === 'mouse') play('hover')
          }
        : undefined,
      onClick: () => play('click'),
    }),
    [play, hover],
  )
}
