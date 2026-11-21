import { about } from '../content/about'
import { experience } from '../content/experience'
import { profile } from '../content/profile'
import { skills } from '../content/skills'
import { AboutHeadline } from '../components/about/AboutHeadline'
import { AboutMotionStyles } from '../components/about/AboutMotionStyles'
import { ExperienceTimeline } from '../components/about/ExperienceTimeline'
import { Reveal } from '../components/about/Reveal'
import { Toolkit } from '../components/about/Toolkit'
import { CtaSection } from '../components/ui/CtaSection'
import { MonoLabel } from '../components/ui/MonoLabel'

const sectionClass = 'page-container border-t border-line-faint py-[72px] md:py-[120px]'

export function AboutPage() {
  return (
    <>
      <AboutMotionStyles />
      <section aria-labelledby="about-title" className="page-container pb-[72px] pt-14 md:pb-[140px] md:pt-[120px]">
        <AboutHeadline id="about-title" headline={about.headline} mark={about.headlineMark} />
        <Reveal as="p" delay={450} className="m-0 mt-10 max-w-[460px] font-mono text-xs uppercase leading-[1.7] tracking-[0.12em] text-soft">
          {about.note}
        </Reveal>
      </section>

      <section aria-labelledby="bio-title" className={`${sectionClass} flex flex-col gap-8 md:flex-row md:gap-20`}>
        <Reveal className="flex-none max-w-full">
          <img
            src={profile.portrait.src}
            alt={profile.portrait.alt}
            width={930}
            height={1400}
            loading="lazy"
            decoding="async"
            className="block h-[400px] w-[350px] max-w-full rounded-card object-cover object-[50%_18%] grayscale-[0.35] md:h-[540px] md:w-[440px]"
          />
        </Reveal>
        <div className="flex min-w-0 max-w-[720px] flex-1 flex-col gap-6">
          <Reveal delay={0}>
            <MonoLabel tone="lime">{about.label}</MonoLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="bio-title" className="m-0 text-lead-lg font-normal">
              {about.lead}
            </h2>
          </Reveal>
          {about.bio.map((paragraph, i) => (
            <Reveal key={paragraph} as="p" delay={160 + i * 100} className="m-0 text-body leading-[1.65] text-soft">
              {paragraph}
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="exp-title" className={sectionClass}>
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="exp-title" className="m-0 text-h2">
            {about.experience.heading}
          </h2>
          <MonoLabel>{about.experience.range}</MonoLabel>
        </div>
        <ExperienceTimeline items={experience} />
      </section>

      <section aria-labelledby="skills-title" className={sectionClass}>
        <h2 id="skills-title" className="m-0 mb-10 text-h2">
          {about.toolkit.heading}
        </h2>
        <Toolkit groups={skills} />
      </section>

      <CtaSection
        eyebrow={about.cta.eyebrow}
        title={about.cta.title}
        mark={about.cta.mark}
        primary={{ label: about.cta.button, href: profile.emailHref }}
        secondary={about.cta.secondary}
      />
    </>
  )
}
