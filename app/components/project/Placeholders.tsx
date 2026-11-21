import { Fragment } from 'react'
import { projectPage } from '../../content/projects'

const PLACEHOLDER = /(\[[^\]]+\])/

/**
 * Renders text, giving every `[bracketed]` placeholder ("[ADD: year]",
 * "[CHECK]") a dashed lime underline so the owner notices it before launch.
 * The text itself is left exactly as written in the content file.
 */
export function WithPlaceholders({ text }: { text: string }) {
  return (
    <>
      {text.split(PLACEHOLDER).map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            data-placeholder=""
            title={projectPage.placeholderHint}
            className="underline decoration-lime decoration-dashed decoration-1 underline-offset-[6px]"
          >
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
