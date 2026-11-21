// Fallback when a CSS color variable is missing: the accent lime (#c6ff3d).
const FALLBACK: [number, number, number] = [198, 255, 61]

/** Parses a hex (#rgb / #rrggbb) or rgb()/rgba() string into an [r, g, b] tuple. */
export function parseColor(colorStr: string): [number, number, number] {
  colorStr = (colorStr || '').trim()
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1)
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    const num = parseInt(hex, 16)
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
  }
  const match = colorStr.match(/\d+/g)
  if (match && match.length >= 3) {
    return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])]
  }
  return FALLBACK
}
