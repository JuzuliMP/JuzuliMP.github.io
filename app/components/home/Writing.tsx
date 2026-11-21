import type { Article } from '../../content/types'
import type { HomePageContent } from '../../content/home'
import { externalProps } from '../../lib/links'
import { ArrowLink } from '../ui/ArrowLink'
import { MonoLabel } from '../ui/MonoLabel'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** "Apr 2026" to a sortable number (year * 12 + month). Unparseable dates sort last. */
export function articleOrder(date: string): number {
  const match = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(date.trim())
  const month = match ? MONTHS.indexOf(match[1]!.toLowerCase()) : -1
  return match && month >= 0 ? Number(match[2]) * 12 + month : Number.NEGATIVE_INFINITY
}

/** Newest first. Articles with the same month keep the order they were written in. */
export function sortNewestFirst(articles: readonly Article[]): Article[] {
  return articles
    .map((article, index) => ({ article, index }))
    .sort((a, b) => articleOrder(b.article.date) - articleOrder(a.article.date) || a.index - b.index)
    .map((x) => x.article)
}

/** Three articles, newest first, each an external link, plus the link to the full list. */
export function Writing({ content }: { content: HomePageContent['writing'] }) {
  return (
    <section aria-labelledby="writing" className="page-container border-t border-line-faint py-[72px] md:py-[120px]">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="writing" className="m-0 text-h2">
          {content.heading}
        </h2>
        <ArrowLink href={content.link.href}>{content.link.label}</ArrowLink>
      </div>
      <ul className="m-0 list-none border-b border-line p-0">
        {sortNewestFirst(content.articles).map((a) => (
          <li key={a.href}>
            <a
              href={a.href}
              {...externalProps(a.href)}
              className="flex flex-col items-start gap-x-8 gap-y-2.5 border-t border-line py-7 text-paper no-underline transition-colors duration-150 hover:text-lime md:flex-row md:items-baseline"
            >
              <MonoLabel as="span" className="md:w-[140px] md:flex-none">
                {a.date}
              </MonoLabel>
              <span className="min-w-0 flex-1 text-xl leading-[1.3] tracking-[-0.015em] md:text-[26px]">{a.title}</span>
              <MonoLabel as="span" tone="lime" className="flex-none">
                {content.readLabel}
                <span aria-hidden="true"> ↗</span>
              </MonoLabel>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
