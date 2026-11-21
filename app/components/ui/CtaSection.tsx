import type { ExternalLink } from '../../content/types'
import { LimeDot } from './LimeDot'
import { MonoLabel } from './MonoLabel'
import { PillLink } from './PillLink'
import { ArrowLink } from './ArrowLink'

type CtaSectionProps = {
  eyebrow: string
  title: string
  /** Punctuation after the title, coloured lime ("." or "?"). */
  mark: string
  primary: ExternalLink
  secondary: ExternalLink
}

/** Closing "contact" block shared by Home and About: eyebrow, big headline, lime pill and a text link. */
export function CtaSection({ eyebrow, title, mark, primary, secondary }: CtaSectionProps) {
  return (
    <section
      id="contact"
      aria-labelledby="cta-title"
      className="page-container flex flex-col gap-9 border-t border-line-faint py-24 md:py-40"
    >
      <MonoLabel>{eyebrow}</MonoLabel>
      <h2 id="cta-title" className="m-0 max-w-[1100px] text-display">
        {title}
        <LimeDot char={mark} />
      </h2>
      <div className="flex flex-wrap items-center gap-5">
        <PillLink href={primary.href} variant="lime" size="lg">
          {primary.label}
        </PillLink>
        <ArrowLink href={secondary.href}>{secondary.label}</ArrowLink>
      </div>
    </section>
  )
}
