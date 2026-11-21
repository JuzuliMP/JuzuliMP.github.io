import type { HomeContent } from '../../content/types'
import { MonoLabel } from '../ui/MonoLabel'
import { PillLink } from '../ui/PillLink'

/** The `office_viewer` Flutter package card with its pub.dev and GitHub links. */
export function OpenSource({ content }: { content: HomeContent['openSource'] }) {
  const pkg = content.package
  return (
    <section aria-labelledby="oss" className="page-container border-t border-line-faint py-[72px] md:py-[120px]">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="oss" className="m-0 text-h2">
          {content.heading}
        </h2>
        <MonoLabel>{content.eyebrow}</MonoLabel>
      </div>
      <div className="flex flex-col items-start justify-between gap-8 rounded-card border border-line bg-surface p-6 md:flex-row md:items-center md:p-12">
        <div className="flex min-w-0 max-w-[640px] flex-col gap-4">
          <MonoLabel tone="lime">{pkg.label}</MonoLabel>
          <h3 className="m-0 break-words font-mono text-[clamp(2rem,1.3rem+2.9vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            {pkg.name}
          </h3>
          <p className="m-0 text-body text-soft">{pkg.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {pkg.links.map((l, i) => (
            <PillLink key={l.href} href={l.href} variant={i === 0 ? 'lime' : 'outline'}>
              {l.label}
            </PillLink>
          ))}
        </div>
      </div>
    </section>
  )
}
