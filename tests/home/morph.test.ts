import { describe, expect, it } from 'vitest'
import {
  ENTER_END,
  ENTER_START,
  TEXT_DIM_DEPTH,
  fadeOpacity,
  morphProgress,
  morphState,
  phoneMorphProgress,
  snapState,
  stateFromProgress,
  textOverlapDim,
  type PhoneChapter,
} from '../../app/components/home/particles/morph'
import {
  MOBILE_MAX,
  MOBILE_SHAPE_Y,
  chapterSide,
  mobileShapeCenter,
  mobileShapeSize,
  particleCount,
  sceneLayout,
} from '../../app/components/home/particles/layout'

const VH = 800
const START = VH * ENTER_START // 680
const END = VH * ENTER_END // 200

describe('morphState', () => {
  it('shows the hero field while the first chapter is still below the fold', () => {
    expect(morphState([1700, 2500, 3300], VH)).toEqual({ from: 0, to: 1, t: 0 })
    expect(morphState([START, START + 800, START + 1600], VH)).toEqual({ from: 0, to: 1, t: 0 })
  })

  it('moves from the field to the phone while chapter 1 crosses its window', () => {
    const mid = morphState([(START + END) / 2, 1500, 2300], VH)
    expect(mid.from).toBe(0)
    expect(mid.to).toBe(1)
    expect(mid.t).toBeCloseTo(0.5, 5)
  })

  it('rests fully formed in the middle of a chapter', () => {
    // Chapter 1 above its end line, chapter 2 not yet entering.
    expect(morphState([100, 1000, 1800], VH)).toEqual({ from: 1, to: 2, t: 0 })
    // Same for chapter 2 and 3.
    expect(morphState([-900, 0, 900], VH)).toEqual({ from: 2, to: 3, t: 0 })
  })

  it('interpolates between chapters', () => {
    const s = morphState([-500, (START + END) / 2, 1500], VH)
    expect(s.from).toBe(1)
    expect(s.to).toBe(2)
    expect(s.t).toBeCloseTo(0.5, 5)
    // A quarter of the way through chapter 3's window.
    const quarter = morphState([-1500, -700, START - (START - END) * 0.25], VH)
    expect(quarter.from).toBe(2)
    expect(quarter.t).toBeCloseTo(0.25, 5)
  })

  it('lands on the globe and stays there past chapter 3', () => {
    expect(morphState([-2000, -1200, -400], VH)).toEqual({ from: 2, to: 3, t: 1 })
    expect(morphState([-9000, -8000, -7000], VH)).toEqual({ from: 2, to: 3, t: 1 })
  })

  it('clamps: t is always within 0..1 and indexes within the shapes', () => {
    for (let scroll = -500; scroll <= 6000; scroll += 37) {
      const tops = [900, 1900, 2900].map((y) => y - scroll)
      const s = morphState(tops, VH)
      expect(s.t).toBeGreaterThanOrEqual(0)
      expect(s.t).toBeLessThanOrEqual(1)
      expect(s.from).toBeGreaterThanOrEqual(0)
      expect(s.to).toBeLessThanOrEqual(3)
      expect(s.to).toBe(s.from + 1)
    }
  })

  it('never goes backwards as the page scrolls down', () => {
    let previous = -1
    for (let scroll = 0; scroll <= 5000; scroll += 25) {
      const p = morphProgress([900, 1900, 2900].map((y) => y - scroll), VH)
      expect(p).toBeGreaterThanOrEqual(previous)
      previous = p
    }
    expect(previous).toBe(3)
  })

  it('copes with a zero-height viewport', () => {
    expect(morphProgress([0, 0, 0], 0)).toBe(0)
  })
})

describe('stateFromProgress / snapState', () => {
  it('maps continuous progress to from, to and t', () => {
    expect(stateFromProgress(0, 3)).toEqual({ from: 0, to: 1, t: 0 })
    expect(stateFromProgress(1.25, 3)).toEqual({ from: 1, to: 2, t: 0.25 })
    expect(stateFromProgress(3, 3)).toEqual({ from: 2, to: 3, t: 1 })
    expect(stateFromProgress(7, 3)).toEqual({ from: 2, to: 3, t: 1 })
    expect(stateFromProgress(-2, 3)).toEqual({ from: 0, to: 1, t: 0 })
  })

  it('snaps to the nearest whole shape without any in-between state (reduced motion)', () => {
    expect(snapState(0.2, 3)).toEqual({ from: 0, to: 0, t: 0 })
    expect(snapState(0.6, 3)).toEqual({ from: 1, to: 1, t: 0 })
    expect(snapState(2.4, 3)).toEqual({ from: 2, to: 2, t: 0 })
    expect(snapState(2.6, 3)).toEqual({ from: 3, to: 3, t: 0 })
    expect(snapState(99, 3)).toEqual({ from: 3, to: 3, t: 0 })
    expect(snapState(-1, 3)).toEqual({ from: 0, to: 0, t: 0 })
  })
})

describe('fadeOpacity', () => {
  it('is fully visible while the fade section is below the fold and gone once it is well up the screen', () => {
    expect(fadeOpacity(2000, VH)).toBe(1)
    expect(fadeOpacity(VH * 0.9, VH)).toBe(1)
    expect(fadeOpacity(VH * 0.4, VH)).toBe(0)
    expect(fadeOpacity(-500, VH)).toBe(0)
    expect(fadeOpacity(VH * 0.65, VH)).toBeCloseTo(0.5, 5)
  })

  it('is 1 for degenerate input', () => {
    expect(fadeOpacity(Number.POSITIVE_INFINITY, VH)).toBe(1)
    expect(fadeOpacity(100, 0)).toBe(1)
  })
})

describe('sceneLayout', () => {
  const sides = [chapterSide(0), chapterSide(1), chapterSide(2)]

  it('uses fewer particles below 768px', () => {
    expect(particleCount(MOBILE_MAX - 1)).toBe(1800)
    expect(particleCount(MOBILE_MAX)).toBe(4000)
    expect(particleCount(1440)).toBe(4000)
  })

  it('alternates the shape sides on desktop, like the page layout (right, left, right)', () => {
    expect(sides).toEqual(['right', 'left', 'right'])
    const l = sceneLayout(1440, 900, sides)
    expect(l.mobile).toBe(false)
    expect(l.sizePx).toBe(540)
    expect(l.offsets).toHaveLength(4)
    expect(l.offsets[1]!.x).toBeCloseTo(410, 5)
    expect(l.offsets[2]!.x).toBeCloseTo(-410, 5)
    expect(l.offsets[3]!.x).toBeCloseTo(410, 5)
    expect(l.offsets[0]!.x).toBe(0)
    expect(l.dim).toBe(1)
  })

  it('shrinks the scene on narrow desktops and keeps it inside the container', () => {
    const l = sceneLayout(768, 900, sides)
    expect(l.sizePx).toBeGreaterThanOrEqual(280)
    expect(l.sizePx).toBeLessThan(540)
    expect(Math.abs(l.offsets[1]!.x) + l.sizePx / 2).toBeLessThanOrEqual(768 / 2 - 40 + 0.001)
  })

  it('fixes every phone shape at one place: centred, a little below the middle, fitting the width and 40% of the height', () => {
    const l = sceneLayout(390, 844, sides)
    expect(l.mobile).toBe(true)
    expect(l.sizePx).toBe(mobileShapeSize(390, 844))
    expect(l.sizePx).toBeLessThanOrEqual(Math.min(390 - 40, 844 * 0.4))
    expect(l.dim).toBeLessThan(1)
    for (const o of l.offsets.slice(1)) {
      expect(o.x).toBe(0)
      expect(o.y).toBeCloseTo(844 * MOBILE_SHAPE_Y - 844 / 2, 5)
    }
    // The whole shape is on screen.
    expect(mobileShapeCenter(844) + l.sizePx / 2).toBeLessThan(844)
    expect(mobileShapeCenter(844) - l.sizePx / 2).toBeGreaterThan(80) // below the header
  })

  it('keeps the phone shape between 200 and 320px', () => {
    expect(mobileShapeSize(390, 844)).toBe(320)
    expect(mobileShapeSize(375, 667)).toBeCloseTo(266.8, 5)
    expect(mobileShapeSize(320, 480)).toBe(200)
    expect(mobileShapeSize(700, 2000)).toBe(320)
  })

  it('rests the field near the bottom of the viewport and stretches it across', () => {
    const l = sceneLayout(1440, 900, sides)
    const half = l.sizePx / 2
    // Lowest field point (-0.56 half-units) lands 24px above the bottom edge.
    expect(l.offsets[0]!.y + 0.56 * half).toBeCloseTo(900 / 2 - 24, 5)
    expect(l.spreadX * l.sizePx).toBeCloseTo(1440, 5)
  })
})

describe('phoneMorphProgress (phones: fixed shape, page scrolls normally)', () => {
  const VH_P = 844
  const SIZE = 320
  const CENTER = mobileShapeCenter(VH_P) // 506.4
  // Three chapters laid out like the page: text 450px tall, 32px gap, a 371px stage, 144px of padding between sections.
  const TEXT_H = 450
  const STAGE_H = 371
  const PITCH = TEXT_H + 32 + STAGE_H + 144
  const page = (firstTextTop: number): PhoneChapter[] =>
    [0, 1, 2].map((k) => {
      const textTop = firstTextTop + k * PITCH
      return { textTop, stageCenter: textTop + TEXT_H + 32 + STAGE_H / 2 }
    })
  /** The first text top at which chapter k's stage is lined up with the shape. */
  const aligned = (k: number) => CENTER - (TEXT_H + 32 + STAGE_H / 2) - k * PITCH

  it('stays on the hero field until chapter 1\'s text reaches the shape', () => {
    expect(phoneMorphProgress(page(VH_P + 100), CENTER, SIZE)).toBe(0)
    expect(phoneMorphProgress(page(CENTER + SIZE / 2), CENTER, SIZE)).toBe(0)
  })

  it('forms each icon continuously while its chapter scrolls in, finished exactly when its stage lines up', () => {
    const start = CENTER + SIZE / 2
    const mid = (start + aligned(0)) / 2
    expect(phoneMorphProgress(page(mid), CENTER, SIZE)).toBeCloseTo(0.5, 5)
    expect(phoneMorphProgress(page(aligned(0)), CENTER, SIZE)).toBeCloseTo(1, 5)
    expect(phoneMorphProgress(page(aligned(1)), CENTER, SIZE)).toBeCloseTo(2, 5)
    expect(phoneMorphProgress(page(aligned(2)), CENTER, SIZE)).toBeCloseTo(3, 5)
  })

  it('moves with every pixel of scroll inside a transition (no pinning, no dead zone while text crosses)', () => {
    const start = CENTER + SIZE / 2
    let previous = phoneMorphProgress(page(start), CENTER, SIZE)
    for (let top = start - 10; top > aligned(0); top -= 10) {
      const p = phoneMorphProgress(page(top), CENTER, SIZE)
      expect(p).toBeGreaterThan(previous)
      previous = p
    }
  })

  it('rests on the finished icon between chapters, then starts the next one as its text arrives', () => {
    // Just after chapter 1 lines up, the shape stays a phone…
    expect(phoneMorphProgress(page(aligned(0) - 60), CENTER, SIZE)).toBeCloseTo(1, 5)
    // …until chapter 2's text reaches the shape's bottom edge.
    const ch2Arrives = CENTER + SIZE / 2 - PITCH
    expect(phoneMorphProgress(page(ch2Arrives + 1), CENTER, SIZE)).toBeCloseTo(1, 5)
    expect(phoneMorphProgress(page(ch2Arrives - 40), CENTER, SIZE)).toBeGreaterThan(1)
  })

  it('never goes backwards while scrolling down and clamps at the last shape', () => {
    let previous = 0
    for (let top = VH_P + 200; top > -4000; top -= 25) {
      const p = phoneMorphProgress(page(top), CENTER, SIZE)
      expect(p).toBeGreaterThanOrEqual(previous - 1e-12)
      previous = p
    }
    expect(previous).toBe(3)
  })

  it('ignores missing chapters and bad input', () => {
    expect(phoneMorphProgress([], CENTER, SIZE)).toBe(0)
    expect(phoneMorphProgress(page(0), CENTER, 0)).toBe(0)
    expect(phoneMorphProgress(page(0), Number.NaN, SIZE)).toBe(0)
    const missing = { textTop: Number.POSITIVE_INFINITY, stageCenter: Number.POSITIVE_INFINITY }
    expect(phoneMorphProgress([missing, missing], CENTER, SIZE)).toBe(0)
  })
})

describe('textOverlapDim (phones: particles dim under passing text)', () => {
  const CENTER = 500
  const SIZE = 300 // band 350..650

  it('is 1 when no text is over the shape', () => {
    expect(textOverlapDim([], CENTER, SIZE)).toBe(1)
    expect(textOverlapDim([{ top: 0, bottom: 340 }], CENTER, SIZE)).toBe(1)
    expect(textOverlapDim([{ top: 660, bottom: 1100 }], CENTER, SIZE)).toBe(1)
  })

  it('dims fully once most of the band is covered', () => {
    expect(textOverlapDim([{ top: 200, bottom: 900 }], CENTER, SIZE)).toBeCloseTo(1 - TEXT_DIM_DEPTH, 5)
    expect(textOverlapDim([{ top: 350, bottom: 560 }], CENTER, SIZE)).toBeCloseTo(1 - TEXT_DIM_DEPTH, 5)
  })

  it('changes smoothly as text slides over the band', () => {
    let previous = 1
    for (let bottom = 350; bottom <= 650; bottom += 10) {
      const d = textOverlapDim([{ top: 0, bottom }], CENTER, SIZE)
      expect(d).toBeLessThanOrEqual(previous + 1e-12)
      expect(previous - d).toBeLessThan(0.12)
      previous = d
    }
  })

  it('adds up several text blocks and ignores bad input', () => {
    const one = textOverlapDim([{ top: 350, bottom: 400 }], CENTER, SIZE)
    const two = textOverlapDim([{ top: 350, bottom: 400 }, { top: 600, bottom: 650 }], CENTER, SIZE)
    expect(two).toBeLessThan(one)
    expect(textOverlapDim([{ top: Number.NaN, bottom: 900 }], CENTER, SIZE)).toBe(1)
    expect(textOverlapDim([{ top: 0, bottom: 900 }], CENTER, 0)).toBe(1)
  })
})
