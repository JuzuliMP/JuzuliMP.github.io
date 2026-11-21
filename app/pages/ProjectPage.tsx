import { projectPage, requireProject } from '../content/projects'
import type { ProjectSlug } from '../content/types'
import { ProjectHeading } from '../components/project/ProjectHeading'
import { WithPlaceholders } from '../components/project/Placeholders'
import { Reveal } from '../components/project/Reveal'
import { ScreenshotStrip } from '../components/project/ScreenshotStrip'
import { ArrowLink } from '../components/ui/ArrowLink'
import { MonoLabel } from '../components/ui/MonoLabel'
import { PillLink } from '../components/ui/PillLink'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TagList } from '../components/ui/Tag'

export function ProjectPage({ slug }: { slug: ProjectSlug }) {
  const project = requireProject(slug)
  const next = requireProject(project.nextSlug)
  const labels = projectPage.factLabels
  const facts: [string, string][] = [
    [labels.role, project.facts.role],
    [labels.company, project.facts.company],
    [labels.year, project.facts.year],
    [labels.platforms, project.facts.platforms],
  ]

  return (
    <>
      <section
        aria-labelledby="project-title"
        className="page-container pb-[72px] pt-6 md:pb-[120px] md:pt-14"
      >
        <ArrowLink href="/work/" direction="back" tone="soft">
          {projectPage.back}
        </ArrowLink>

        <div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:gap-16">
          <Reveal className="w-full min-w-0 md:w-1/2 md:flex-1 md:basis-1/2">
            <MonoLabel tone="lime">
              {project.number} — {project.domain}
            </MonoLabel>
            <ProjectHeading id="project-title" name={project.name} size={project.h1Size} />
            <p className="m-0 mt-8 max-w-[600px] text-[22px] leading-[1.35] tracking-[-0.015em] md:text-[30px]">
              <WithPlaceholders text={project.summary} />
            </p>
          </Reveal>
          <Reveal delay={120} className="w-full min-w-0 md:w-1/2 md:flex-1 md:basis-1/2">
            <img
              src={project.cover.src}
              alt={project.cover.alt}
              width={project.cover.width}
              height={project.cover.height}
              decoding="async"
              className="block h-auto w-full rounded-card"
            />
          </Reveal>
        </div>

        <dl className="m-0 mt-14 grid grid-cols-2 gap-6 border-t border-line pt-6 md:grid-cols-4">
          {facts.map(([term, value]) => (
            <div key={term} className="flex flex-col gap-2">
              <MonoLabel as="dt" size="sm">
                {term}
              </MonoLabel>
              <dd className="m-0 text-lg leading-[1.4]">
                <WithPlaceholders text={value} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
          {project.stack?.length ? <TagList tags={project.stack} /> : null}
          <PillLink href={project.link.href}>{project.link.label}</PillLink>
        </div>
      </section>

      <section
        aria-label={projectPage.caseStudyLabel}
        className="page-container flex flex-col py-[72px] md:py-[120px]"
      >
        {project.sections.map((s, i) => (
          <Reveal
            key={s.title}
            className={`flex flex-col gap-3 border-t border-line py-8 md:flex-row md:gap-10 ${
              i === project.sections.length - 1 ? 'border-b' : ''
            }`}
          >
            <SectionHeading className="md:w-[280px] md:flex-none">{s.title}</SectionHeading>
            <p className="m-0 min-w-0 max-w-[760px] flex-1 text-body leading-[1.65] text-soft">
              <WithPlaceholders text={s.body} />
            </p>
          </Reveal>
        ))}
      </section>

      <ScreenshotStrip project={project} />

      <section
        aria-label={projectPage.nextEyebrow}
        className="border-t border-line-faint"
      >
        <Reveal>
          <a
            href={`/work/${next.slug}/`}
            aria-label={`${projectPage.nextEyebrow}: ${next.name}`}
            className="group page-container flex flex-col gap-3.5 py-[72px] text-paper no-underline md:flex-row md:items-end md:justify-between md:py-[120px]"
          >
            <span className="flex flex-col gap-3.5">
              <MonoLabel as="span">{projectPage.nextEyebrow}</MonoLabel>
              <span className="flex items-start gap-3">
                <span className="text-row-lg transition-colors duration-200 group-hover:text-lime group-focus-visible:text-lime">
                  {next.name}
                  <span aria-hidden="true"> →</span>
                </span>
                <span aria-hidden="true" className="mt-2 font-mono text-xs text-lime">
                  {next.number}
                </span>
              </span>
            </span>
            <img
              src={next.cover.src}
              alt=""
              width={next.cover.width}
              height={next.cover.height}
              loading="lazy"
              decoding="async"
              className="mt-4 h-auto w-full max-w-[350px] rounded-card md:mt-0 md:w-[300px]"
            />
          </a>
        </Reveal>
      </section>
    </>
  )
}
