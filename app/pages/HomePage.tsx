import { home } from '../content/home'
import { profile } from '../content/profile'
import { requireProject } from '../content/projects'
import { CtaSection } from '../components/ui/CtaSection'
import { Chapter, chapterSectionId } from '../components/home/Chapter'
import { Hero } from '../components/home/Hero'
import { Loader } from '../components/home/Loader'
import { OpenSource } from '../components/home/OpenSource'
import { ParticleScene } from '../components/home/particles/ParticleScene'
import { SELECTED_APPS_ID, SelectedApps } from '../components/home/SelectedApps'
import { Writing } from '../components/home/Writing'

/**
 * Home: hero, three scroll chapters over a fixed particle scene, selected
 * apps, open source, writing and the contact call to action.
 *
 * The loader and the particle scene are client-only (the prerendered HTML has
 * a hidden loader shell and an empty scene container). The content wrapper is
 * `relative z-10` so it paints above the scene (`z-0`) and below the header.
 */
export function HomePage() {
  const { hero, chapters, selectedApps, openSource, writing, cta, loader } = home
  const apps = selectedApps.slugs.map(requireProject)

  return (
    <>
      <Loader content={loader} />
      <ParticleScene
        shapes={chapters.map((c) => c.shape)}
        sectionIds={chapters.map(chapterSectionId)}
        fadeId={SELECTED_APPS_ID}
      />
      <div className="relative z-10">
        <Hero hero={hero} socials={profile.socials} />
        {chapters.map((c, i) => (
          <Chapter key={c.number} chapter={c} index={i} />
        ))}
        <SelectedApps content={selectedApps} apps={apps} />
        <OpenSource content={openSource} />
        <Writing content={writing} />
        <CtaSection
          eyebrow={cta.eyebrow}
          title={cta.title}
          mark={cta.mark}
          primary={{ label: cta.button, href: profile.emailHref }}
          secondary={cta.secondary}
        />
      </div>
    </>
  )
}
