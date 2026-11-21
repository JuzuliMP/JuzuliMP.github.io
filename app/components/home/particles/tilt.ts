/**
 * The slow idle motion of the shapes. Pure: time in seconds in, angles in
 * radians out.
 *
 * Chapter icons turn around their vertical axis. The hero field is much wider
 * than tall (it is stretched across the viewport), so it gets a smaller turn
 * (yaw) plus a slight nod (pitch) on a different period: it rocks gently in 3D
 * instead of spinning, and the two never line up into an obvious loop.
 */

/** Chapter icons: largest turn (rad) and angular speed (rad/s), about a 21 s cycle. */
export const ICON_SWAY = 0.45
export const ICON_SWAY_SPEED = 0.3

/** Hero field: largest turn around y (rad, ~8°), about a 26 s cycle. */
export const FIELD_YAW = 0.14
export const FIELD_YAW_SPEED = 0.24
/** Hero field: largest nod around x (rad, ~5°), about a 37 s cycle, so it drifts out of step with the turn. */
export const FIELD_PITCH = 0.09
export const FIELD_PITCH_SPEED = 0.17

/** Turn of the chapter icons around y at `seconds`. */
export function iconSway(seconds: number): number {
  return Math.sin(seconds * ICON_SWAY_SPEED) * ICON_SWAY
}

export type FieldTilt = { yaw: number; pitch: number }

/** Tilt of the hero field at `seconds`. Both angles start at rest, so the first frames after load do not jump. */
export function fieldTilt(seconds: number): FieldTilt {
  return {
    yaw: Math.sin(seconds * FIELD_YAW_SPEED) * FIELD_YAW,
    pitch: Math.sin(seconds * FIELD_PITCH_SPEED) * FIELD_PITCH,
  }
}
