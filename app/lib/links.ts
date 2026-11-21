/** True for absolute http(s) URLs, which open in a new tab. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}

/** Extra anchor attributes for external links. */
export function externalProps(href: string): { target?: '_blank'; rel?: string } {
  return isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/**
 * Removes a leading or trailing arrow glyph from a plain-string label. Link
 * primitives add their own arrow, so copy that already carries one ("View on
 * pub.dev ↗") is not doubled. Non-string children are returned untouched.
 */
export function stripArrow<T>(children: T): T | string {
  if (typeof children !== 'string') return children
  return children.replace(/\s*[→↗←]\s*$/, '').replace(/^\s*[→↗←]\s*/, '')
}
