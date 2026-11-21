import { describe, expect, it } from 'vitest'
import {
  FIELD_PITCH,
  FIELD_PITCH_SPEED,
  FIELD_YAW,
  FIELD_YAW_SPEED,
  ICON_SWAY,
  fieldTilt,
  iconSway,
} from '../../app/components/home/particles/tilt'

const sampleSeconds = (from: number, to: number, step: number) => {
  const out: number[] = []
  for (let t = from; t <= to; t += step) out.push(t)
  return out
}

describe('iconSway', () => {
  it('starts at rest and stays within its amplitude', () => {
    expect(iconSway(0)).toBe(0)
    for (const t of sampleSeconds(0, 120, 0.25)) expect(Math.abs(iconSway(t))).toBeLessThanOrEqual(ICON_SWAY + 1e-12)
  })

  it('keeps the original sway (sin(0.3 t) * 0.45)', () => {
    for (const t of [1, 5.5, 13, 40]) expect(iconSway(t)).toBeCloseTo(Math.sin(t * 0.3) * 0.45, 12)
  })
})

describe('fieldTilt', () => {
  it('starts at rest, so the hero does not jump on load', () => {
    expect(fieldTilt(0)).toEqual({ yaw: 0, pitch: 0 })
    const early = fieldTilt(1 / 60)
    expect(Math.abs(early.yaw)).toBeLessThan(0.01)
    expect(Math.abs(early.pitch)).toBeLessThan(0.01)
  })

  it('is gentler than the icon sway and stays within its limits', () => {
    expect(FIELD_YAW).toBeLessThan(ICON_SWAY)
    expect(FIELD_PITCH).toBeLessThan(FIELD_YAW)
    for (const t of sampleSeconds(0, 300, 0.2)) {
      const { yaw, pitch } = fieldTilt(t)
      expect(Math.abs(yaw)).toBeLessThanOrEqual(FIELD_YAW + 1e-12)
      expect(Math.abs(pitch)).toBeLessThanOrEqual(FIELD_PITCH + 1e-12)
    }
  })

  it('actually rocks: both angles reach most of their range within a minute', () => {
    const samples = sampleSeconds(0, 60, 0.1).map(fieldTilt)
    const yaws = samples.map((s) => s.yaw)
    const pitches = samples.map((s) => s.pitch)
    expect(Math.max(...yaws)).toBeGreaterThan(FIELD_YAW * 0.95)
    expect(Math.min(...yaws)).toBeLessThan(-FIELD_YAW * 0.95)
    expect(Math.max(...pitches)).toBeGreaterThan(FIELD_PITCH * 0.95)
    expect(Math.min(...pitches)).toBeLessThan(-FIELD_PITCH * 0.95)
  })

  it('is slow: no faster than the icons, never a visible snap between frames', () => {
    expect(FIELD_YAW_SPEED).toBeLessThanOrEqual(0.3)
    expect(FIELD_PITCH_SPEED).toBeLessThan(FIELD_YAW_SPEED)
    // Largest change over one 60 fps frame stays far below a degree.
    for (const t of sampleSeconds(0, 60, 0.37)) {
      const a = fieldTilt(t)
      const b = fieldTilt(t + 1 / 60)
      expect(Math.abs(b.yaw - a.yaw)).toBeLessThan(0.001)
      expect(Math.abs(b.pitch - a.pitch)).toBeLessThan(0.001)
    }
  })

  it('turn and nod run on different periods, so the motion does not repeat as an obvious loop', () => {
    const ratio = FIELD_YAW_SPEED / FIELD_PITCH_SPEED
    expect(Math.abs(ratio - Math.round(ratio))).toBeGreaterThan(0.2)
  })
})
