/**
 * Scroll to morph mapping for the Home particle scene. Pure functions only.
 *
 * The scene has `steps + 1` shapes (field, then one per chapter). Each chapter
 * section has a transition window: it starts when the section's top edge is at
 * `ENTER_START` of the viewport height and ends when it reaches `ENTER_END`.
 * Between windows the shape rests fully formed while the chapter text is read.
 */

export type MorphState = {
  /** Index of the shape the points are leaving. */
  from: number
  /** Index of the shape the points are heading to. */
  to: number
  /** Linear progress 0..1 from `from` to `to` (the shader eases it per point). */
  t: number
}

/** Section top, as a fraction of the viewport height, where its morph starts (just entering from below). */
export const ENTER_START = 0.85
/** Section top, as a fraction of the viewport height, where its morph is complete. */
export const ENTER_END = 0.25

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Continuous progress 0..`tops.length`. `tops` are the viewport-relative top
 * positions of the chapter sections (`getBoundingClientRect().top`), in order.
 * 0 = the hero field, 1 = chapter 1's shape fully formed, and so on.
 */
export function morphProgress(tops: readonly number[], viewportHeight: number): number {
  if (!(viewportHeight > 0)) return 0
  const start = viewportHeight * ENTER_START
  const end = viewportHeight * ENTER_END
  let p = 0
  for (const top of tops) p += clamp01((start - top) / (start - end))
  return p
}

/**
 * Phones: one chapter as the scene sees it, viewport-relative. `textTop` is
 * the top of the chapter's text block, `stageCenter` the centre of the empty
 * stage under it. Both move together as the page scrolls.
 */
export type PhoneChapter = { textTop: number; stageCenter: number }

/**
 * Phones: continuous progress like `morphProgress`, for a shape that is fixed
 * on screen while the page scrolls normally (no pinning). Chapter k's morph
 * starts as its text reaches the bottom edge of the shape and ends exactly as
 * its stage lines up with the shape, so the icon forms while the chapter
 * scrolls in and the finished icon shows in the empty space under the text.
 * `shapeCenter` is px from the top of the viewport, `shapeSize` the shape's box.
 */
export function phoneMorphProgress(
  chapters: readonly PhoneChapter[],
  shapeCenter: number,
  shapeSize: number,
): number {
  if (!(shapeSize > 0) || !Number.isFinite(shapeCenter)) return 0
  const start = shapeCenter + shapeSize / 2
  let p = 0
  for (const c of chapters) {
    if (!Number.isFinite(c.textTop) || !Number.isFinite(c.stageCenter)) continue
    // Where the text top is when the stage lines up with the shape.
    const end = shapeCenter - (c.stageCenter - c.textTop)
    if (!(start > end)) {
      p += c.textTop <= end ? 1 : 0
      continue
    }
    p += clamp01((start - c.textTop) / (start - end))
  }
  return p
}

/** Phones: how far the particles dim (1 - this) when text fully covers the shape. */
export const TEXT_DIM_DEPTH = 0.5

/**
 * Phones: opacity multiplier for the particles while chapter text passes over
 * the shape, from 1 (no text over it) down to `1 - TEXT_DIM_DEPTH`. Depends only
 * on how much of the shape's band the text blocks cover, so it changes
 * smoothly with scroll and needs no timers.
 */
export function textOverlapDim(
  texts: ReadonlyArray<{ top: number; bottom: number }>,
  shapeCenter: number,
  shapeSize: number,
): number {
  if (!(shapeSize > 0) || !Number.isFinite(shapeCenter)) return 1
  const lo = shapeCenter - shapeSize / 2
  const hi = shapeCenter + shapeSize / 2
  let covered = 0
  for (const t of texts) {
    if (!Number.isFinite(t.top) || !Number.isFinite(t.bottom)) continue
    covered += Math.max(0, Math.min(hi, t.bottom) - Math.max(lo, t.top))
  }
  // Reaches full dimming once about two thirds of the band is covered.
  const f = Math.min(1, (covered / shapeSize) * 1.5)
  const eased = f * f * (3 - 2 * f)
  return 1 - TEXT_DIM_DEPTH * eased
}

/** Turns continuous progress into `{ from, to, t }`, clamped to the available shapes. */
export function stateFromProgress(progress: number, steps: number): MorphState {
  const last = Math.max(0, steps - 1)
  const p = Math.min(Math.max(progress, 0), steps)
  const from = Math.min(Math.floor(p), last)
  return { from, to: from + 1, t: p - from }
}

/** `{ from, to, t }` for the current scroll position. */
export function morphState(tops: readonly number[], viewportHeight: number): MorphState {
  return stateFromProgress(morphProgress(tops, viewportHeight), tops.length)
}

/** Reduced motion: no in-between frames. The shape of the section most in view, shown whole. */
export function snapState(progress: number, steps: number): MorphState {
  const index = Math.min(Math.max(Math.round(progress), 0), steps)
  return { from: index, to: index, t: 0 }
}

/**
 * Opacity of the whole canvas. Full while the chapters are on screen, fading
 * to nothing as the "fade" section (Selected apps) scrolls in so the text on
 * top of it stays readable.
 */
export function fadeOpacity(fadeTop: number, viewportHeight: number): number {
  if (!(viewportHeight > 0) || !Number.isFinite(fadeTop)) return 1
  const start = viewportHeight * 0.9
  const end = viewportHeight * 0.4
  return 1 - clamp01((start - fadeTop) / (start - end))
}
