import { describe, expect, it } from 'vitest'
import { parseColor } from '../../app/lib/parseColor'

// The fallback in parseColor.ts is the accent lime (#c6ff3d).
const FALLBACK = [198, 255, 61]

describe('parseColor', () => {
  it('parses #rrggbb hex', () => {
    expect(parseColor('#c6ff3d')).toEqual([198, 255, 61])
    expect(parseColor('#000000')).toEqual([0, 0, 0])
    expect(parseColor('#FFFFFF')).toEqual([255, 255, 255])
  })

  it('expands #rgb shorthand', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255])
    expect(parseColor('#0af')).toEqual([0, 170, 255])
  })

  it('parses rgb() and rgba() strings', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30])
    expect(parseColor('rgba(242, 240, 234, 0.12)')).toEqual([242, 240, 234])
    expect(parseColor('rgb(1,2,3)')).toEqual([1, 2, 3])
  })

  it('trims surrounding whitespace', () => {
    expect(parseColor('  #0b0b0c  ')).toEqual([11, 11, 12])
    expect(parseColor('\n rgb(5, 6, 7) \t')).toEqual([5, 6, 7])
  })

  it('falls back for empty or invalid input', () => {
    expect(parseColor('')).toEqual(FALLBACK)
    expect(parseColor('   ')).toEqual(FALLBACK)
    expect(parseColor('not-a-color')).toEqual(FALLBACK)
    expect(parseColor('rgb(1, 2)')).toEqual(FALLBACK)
    expect(parseColor(undefined as unknown as string)).toEqual(FALLBACK)
  })
})
