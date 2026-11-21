/** Joins class names, skipping falsy values. (No tailwind-merge: later classes do not dedupe earlier ones.) */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
