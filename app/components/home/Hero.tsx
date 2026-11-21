import type { HomeContent, Social } from '../../content/types'
import { LimeDot } from '../ui/LimeDot'
import { MonoLabel } from '../ui/MonoLabel'
import { PillLink } from '../ui/PillLink'
import { RevealGroup, RevealLine } from './Reveal'

type HeroProps = {
  hero: HomeContent['hero']
  socials: readonly Social[]
}

/** Eyebrow, two-line name, bio, social pills and the scroll cue. The particle field sits behind it, fixed to the viewport. */
export function Hero({ hero, socials }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="page-container relative flex min-h-[720px] flex-col pb-16 pt-14 md:min-h-[880px] md:pt-28"
    >
      <RevealGroup mode="hero">
        <MonoLabel>
          <RevealLine index={0}>{hero.eyebrow}</RevealLine>
        </MonoLabel>
        <h1 id="hero-title" className="m-0 mt-6 text-hero">
          <RevealLine index={1}>{hero.nameLines[0]}</RevealLine>{' '}
          <RevealLine index={2}>
            {hero.nameLines[1]}
            <LimeDot />
          </RevealLine>
        </h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <RevealLine index={3} kind="fade" className="flex max-w-[520px] flex-col gap-6">
            <p className="m-0 text-body text-soft">{hero.bio}</p>
            <nav aria-label="Social links" className="flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <PillLink key={s.id} href={s.href} variant="chip">
                  {s.label}
                </PillLink>
              ))}
            </nav>
          </RevealLine>
          <RevealLine index={4} kind="fade">
            <MonoLabel tone="soft" className="flex items-center gap-3.5">
              {hero.scrollCue.label}
              <span aria-hidden="true" className="block h-px w-16 bg-lime" />
              {hero.scrollCue.counter}
            </MonoLabel>
          </RevealLine>
        </div>
      </RevealGroup>
    </section>
  )
}
