import type { CSSProperties } from 'react'
import { LimeDot } from '../ui/LimeDot'

type ProjectHeadingProps = {
  id: string
  name: string
  size: { min: number; max: number }
}

/** Rough glyph width of the display face (light weight, -0.06em tracking) in em. */
const EM_PER_CHAR = 0.5

/**
 * The project h1. Its size is fluid between the mockup's mobile and desktop
 * values; from md up it is additionally capped to the width of the hero's left
 * half, so long names never run into the cover image on tablets. Multi-word
 * names break onto one word per line, as in the mockups ("Superr / Parents.").
 */
export function ProjectHeading({ id, name, size }: ProjectHeadingProps) {
  const words = name.split(' ')
  const widest = Math.max(...words.map((w) => w.length)) + 1 // + the lime dot
  const style = {
    '--h1-fluid': `clamp(${size.min}px, calc(${size.min}px + ${size.max - size.min} * (100vw - 390px) / 1050), ${size.max}px)`,
    // Left half of the hero: (viewport - 2 x 40px padding - 64px gap) / 2.
    '--h1-cap': `calc((50vw - 72px) / ${widest * EM_PER_CHAR})`,
  } as CSSProperties

  return (
    <h1
      id={id}
      style={style}
      className={`m-0 mt-4 text-[length:var(--h1-fluid)] font-light tracking-[-0.06em] md:text-[length:min(var(--h1-fluid),var(--h1-cap))] ${
        words.length > 1 ? 'leading-[0.9]' : 'leading-[0.88]'
      }`}
    >
      {words.map((word, i) => (
        <span key={word}>
          {i > 0 ? ' ' : null}
          <span className={words.length > 1 ? 'block' : undefined}>
            {word}
            {i === words.length - 1 ? <LimeDot /> : null}
          </span>
        </span>
      ))}
    </h1>
  )
}
