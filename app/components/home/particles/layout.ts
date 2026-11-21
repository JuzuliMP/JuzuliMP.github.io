/**
 * Where each shape sits on screen. Mirrors the page layout: from the md
 * breakpoint the chapters alternate text left / shape right, then the reverse.
 *
 * Below md the text is a single column. The canvas works as on desktop: it is
 * fixed, every chapter shape sits at the same place on screen (centred, a
 * little below the middle, `MOBILE_SHAPE_Y`), and the page scrolls normally
 * over it. Each chapter has an empty "stage" under its text
 * (`SCENE_ANCHOR_ATTR`); the morph finishes exactly as the stage lines up with
 * the shape, so the finished icon shows in that space, and particles dim while
 * text passes over them (see `phoneMorphProgress` and `textOverlapDim` in morph.ts).
 *
 * All values are CSS pixels, y pointing down from the centre of the viewport.
 */

export const MOBILE_MAX = 768

/** Phones: the shape's centre, as a fraction of the viewport height from the top. */
export const MOBILE_SHAPE_Y = 0.6

export type ScenePoint = { x: number; y: number }

export type SceneLayout = {
  mobile: boolean
  /** Full size of a shape's box in px (the shapes span -1..1 half-size units). */
  sizePx: number
  /** Stretch applied to the field and the ambient dust so they span the viewport. */
  spreadX: number
  spreadY: number
  /** Opacity multiplier (slightly lower on small screens, where the field sits under the hero text). */
  dim: number
  /** Offset of each shape's centre, by shape index (field, then chapters). */
  offsets: ScenePoint[]
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Particle count: fewer points on phones. */
export function particleCount(viewportWidth: number): number {
  return viewportWidth < MOBILE_MAX ? 1800 : 4000
}

/**
 * Phones: shape size from the screen, between 200 and 320px. At most 40% of
 * the viewport height, so it fits the chapter stage (44% of it, see Chapter.tsx).
 */
export function mobileShapeSize(viewportWidth: number, viewportHeight: number): number {
  return clamp(Math.min(viewportWidth - 40, viewportHeight * 0.4), 200, 320)
}

/** Phones: the shape centre in px from the top of the viewport. */
export function mobileShapeCenter(viewportHeight: number): number {
  return viewportHeight * MOBILE_SHAPE_Y
}

/**
 * `shapeSides` gives, per chapter shape, which side the shape sits on at md
 * and up ("right" for chapters 1 and 3, "left" for chapter 2).
 */
export function sceneLayout(
  viewportWidth: number,
  viewportHeight: number,
  shapeSides: ReadonlyArray<'left' | 'right'>,
): SceneLayout {
  const mobile = viewportWidth < MOBILE_MAX
  const sizePx = mobile
    ? mobileShapeSize(viewportWidth, viewportHeight)
    : (() => {
        const content = Math.min(viewportWidth, 1440) - 80
        const text = Math.min(620, content * 0.55)
        return clamp(content - text - 40, 280, 540)
      })()
  const half = sizePx / 2
  // Field: its lowest points rest 24px above the bottom edge of the viewport.
  const fieldY = viewportHeight / 2 - 24 - 0.56 * half
  const sideX = mobile ? 0 : Math.min(viewportWidth, 1440) / 2 - 40 - half
  const shapeY = mobile ? mobileShapeCenter(viewportHeight) - viewportHeight / 2 : 0
  return {
    mobile,
    sizePx,
    spreadX: viewportWidth / sizePx,
    spreadY: viewportHeight / sizePx,
    dim: mobile ? 0.9 : 1,
    offsets: [
      { x: 0, y: fieldY },
      ...shapeSides.map((side) => ({ x: side === 'right' ? sideX : (sideX === 0 ? 0 : -sideX), y: shapeY })),
    ],
  }
}

/** Attribute on each chapter's stage: the empty block under the text (phones only) that the finished shape shows in. */
export const SCENE_ANCHOR_ATTR = 'data-scene-anchor'

/** Attribute on each chapter's text block, so the scene can dim the particles while text passes over them. */
export const SCENE_TEXT_ATTR = 'data-scene-text'

/** Side of the screen (md and up) a chapter's shape sits on: odd chapters (1, 3) right, even (2) left. */
export function chapterSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'right' : 'left'
}
