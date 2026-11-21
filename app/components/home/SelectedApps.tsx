import type { HomeContent, Project } from '../../content/types'
import { cx } from '../../lib/cx'
import { ArrowLink } from '../ui/ArrowLink'

export const SELECTED_APPS_ID = 'selected-apps'

type SelectedAppsProps = {
  content: HomeContent['selectedApps']
  apps: readonly Project[]
}

/** Three app rows (title, number, cover), each a link to its case study, then the link to all work. */
export function SelectedApps({ content, apps }: SelectedAppsProps) {
  return (
    <section
      id={SELECTED_APPS_ID}
      aria-labelledby="selected"
      className="page-container border-t border-line-faint py-[72px] md:py-[120px]"
    >
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="selected" className="m-0 text-h2">
          {content.heading}
        </h2>
        <ArrowLink href={content.link.href}>{content.link.label}</ArrowLink>
      </div>
      <ul className="m-0 list-none border-b border-line p-0">
        {apps.map((p, i) => (
          <li key={p.slug}>
            <a
              href={`/work/${p.slug}/`}
              className={cx(
                'group flex flex-col items-start justify-between gap-7 border-t border-line py-8 text-paper no-underline transition-colors duration-150 hover:text-lime md:items-center',
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse',
              )}
            >
              <span className="flex items-start gap-3">
                <span className="text-row">{p.name}</span>
                <span
                  aria-hidden="true"
                  className="mt-2 font-mono text-label text-mute transition-colors duration-150 group-hover:text-lime"
                >
                  {p.number}
                </span>
              </span>
              <img
                src={p.cover.src}
                alt={p.cover.listAlt}
                width={p.cover.width}
                height={p.cover.height}
                loading="lazy"
                decoding="async"
                className="h-[200px] w-[350px] max-w-full rounded-card object-cover md:h-[190px] md:w-[320px]"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
