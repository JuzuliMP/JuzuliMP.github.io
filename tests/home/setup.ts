import { vi } from 'vitest'

/** jsdom has no IntersectionObserver, matchMedia or WebGL. Stubs shared by the Home tests. */
export function stubBrowser({ reducedMotion = false }: { reducedMotion?: boolean } = {}) {
  class FakeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: reducedMotion && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }),
  )
  // No WebGL: getContext returns null (without jsdom's "not implemented" console error).
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
  return { getContext }
}
