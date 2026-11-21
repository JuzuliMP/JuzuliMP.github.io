import type { Chapter as ChapterContent } from '../../content/types'
import { cx } from '../../lib/cx'
import { LimeDot } from '../ui/LimeDot'
import { MonoLabel } from '../ui/MonoLabel'
import { TagList } from '../ui/Tag'
import { chapterSide } from './particles/layout'
import { RevealGroup, RevealLine } from './Reveal'

type ChapterProps = {
  chapter: ChapterContent
  /** 0-based position; decides which side the particle shape sits on. */
  index: number
}

export function chapterSectionId(chapter: ChapterContent): string {
  return `chapter-${chapter.number}`
}

/**
 * One scroll chapter: number, big word, lead, body and tags. The section is
 * tall so the particles have room to morph; its position drives the morph.
 * Text on one side, the (fixed) particle shape on the other.
 *
 * Phones: the text is full width and the page scrolls normally. Under the text
 * is an empty stage (`data-scene-anchor`, SCENE_ANCHOR_ATTR in
 * particles/layout.ts), 44% of the screen tall: the fixed particle shape
 * finishes forming as this stage lines up with it, so the icon shows in that
 * space. The text block is marked (`data-scene-text`, SCENE_TEXT_ATTR) so the
 * scene can dim the particles while text passes over them. From md up the
 * stage is hidden and the section is a two-column row.
 */
export function Chapter({ chapter, index }: ChapterProps) {
  const titleId = `ch-${chapter.word.toLowerCase()}`
  return (
    <section
      id={chapterSectionId(chapter)}
      aria-labelledby={titleId}
      data-shape={chapter.shape}
      className="page-container flex min-h-[640px] flex-col gap-8 border-t border-line-faint py-[72px] md:min-h-[820px] md:flex-row md:items-center md:py-24"
    >
      {/* data-scene-text = SCENE_TEXT_ATTR in particles/layout.ts */}
      <div
        data-scene-text=""
        className={cx('min-w-0 md:w-[55%] md:max-w-[620px]', chapterSide(index) === 'left' && 'md:ml-auto')}
      >
        <RevealGroup className="flex flex-col gap-5">
          <MonoLabel tone="lime">
            <RevealLine index={0}>
              {chapter.number} — {chapter.word}
            </RevealLine>
          </MonoLabel>
          <h2 id={titleId} className="m-0 text-chapter">
            <RevealLine index={1}>
              {chapter.word}
              <LimeDot />
            </RevealLine>
          </h2>
          <p className="m-0 mt-2 text-lead">
            <RevealLine index={2}>{chapter.lead}</RevealLine>
          </p>
          <p className="m-0 text-body text-soft">
            <RevealLine index={3}>{chapter.body}</RevealLine>
          </p>
          <RevealLine index={4} kind="fade" className="mt-2">
            <TagList tags={chapter.tags} />
          </RevealLine>
        </RevealGroup>
      </div>
      {/* data-scene-anchor = SCENE_ANCHOR_ATTR in particles/layout.ts. 44% of the screen holds the shape (at most 40%, see mobileShapeSize). */}
      <div aria-hidden="true" data-scene-anchor="" className="h-[clamp(260px,44svh,380px)] md:hidden" />
    </section>
  )
}
