import { useEffect, useRef } from 'react'
import type { ParticleShape } from '../../../content/types'
import { completeLoadTask } from '../loaderGate'
import { useSound } from '../../layout/SoundProvider'
import { createParticleScene, type SceneHandle } from './scene'

type ParticleSceneProps = {
  /** Shape of each chapter, in order (the hero is always the field). */
  shapes: ReadonlyArray<Exclude<ParticleShape, 'field'>>
  /** DOM ids of the chapter sections, one per shape. */
  sectionIds: readonly string[]
  /** DOM id of the section the scene fades out over. */
  fadeId: string
}

/**
 * The fixed, full-viewport particle canvas behind the Home content.
 *
 * Server and first client render are the same empty, decorative container, so
 * there is nothing to hydrate and no `<canvas>` in the prerendered HTML. The
 * canvas and three.js (a dynamic `import('three')`, so a separate chunk) are
 * created in an effect. If WebGL is missing the container simply stays empty.
 *
 * Stacking: the container is `z-0`; the page content wrapper is `relative
 * z-10` and the header is `z-50`, so the scene sits behind the content but
 * above the (non-positioned) page background.
 */
export function ParticleScene({ shapes, sectionIds, fadeId }: ParticleSceneProps) {
  const ref = useRef<HTMLDivElement>(null)
  // The sand sound follows the particles (how much and where they move); a ref keeps the scene from restarting when the callback changes.
  const { motion } = useSound()
  const motionRef = useRef(motion)
  motionRef.current = motion
  const key = `${shapes.join(',')}|${sectionIds.join(',')}|${fadeId}`

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const abort = new AbortController()
    let handle: SceneHandle | null = null
    createParticleScene(container, {
      shapes,
      sectionIds,
      fadeId,
      signal: abort.signal,
      onMotion: (level, place) => motionRef.current(level, place),
    })
      .then((h) => {
        if (abort.signal.aborted) h?.dispose()
        else handle = h
      })
      .catch(() => {
        // Never let the scene break the page or hold the loader.
        completeLoadTask('scene')
        completeLoadTask('frame')
      })
    return () => {
      abort.abort()
      handle?.dispose()
      handle = null
    }
    // `key` stands in for the three props above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-particle-scene=""
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
    />
  )
}
