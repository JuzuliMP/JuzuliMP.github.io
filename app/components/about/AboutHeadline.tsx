import { useEffect, useRef, type CSSProperties } from 'react'
import type { AboutContent } from '../../content/types'

type Props = {
  id: string
  headline: AboutContent['headline']
  /** The lime "&" that opens the second line. */
  mark: string
}

type Word = { text: string; lime: boolean }

function Line({ words, start }: { words: Word[]; start: number }) {
  return (
    <span className="block">
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`}>
          {i > 0 ? ' ' : null}
          <span className="about-word">
            <span className={w.lime ? 'text-lime' : undefined} style={{ '--i': start + i } as CSSProperties}>
              {w.text}
            </span>
          </span>
        </span>
      ))}
    </span>
  )
}

/**
 * The page h1, flush left. Each word sits in an overflow mask and slides up on
 * load, staggered. The hidden start state is CSS-only (`html.js`), so server
 * HTML is fully visible; `data-ready` is set straight on the DOM after mount.
 */
export function AboutHeadline({ id, headline, mark }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Two frames so the hidden state is painted before the transition starts.
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => el.setAttribute('data-ready', 'true'))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [])

  const line1: Word[] = headline[0].split(' ').map((text) => ({ text, lime: false }))
  const line2: Word[] = [
    { text: mark, lime: true },
    ...headline[1].split(' ').map((text) => ({ text, lime: false })),
  ]

  return (
    <h1
      ref={ref}
      id={id}
      className="about-h1 m-0 text-[clamp(2.5rem,0.457rem+8.381vw,8rem)] font-light leading-[0.98] tracking-[-0.05em]"
    >
      <Line words={line1} start={0} />{' '}
      <Line words={line2} start={line1.length} />
    </h1>
  )
}
