import { useEffect, useState } from 'react'

/**
 * Shared state between the loader, the particle scene and the hero reveal.
 *
 * - `shouldShowLoader()` decides, once per tab session, whether the loader runs.
 *   The loader and the hero reveal both ask it, so they agree without needing
 *   to mount in a particular order.
 * - The scene (and the loader itself) report real work through `completeLoadTask`.
 * - When the loader finishes (or is skipped) `markLoaderDone()` lets the hero rise.
 */

/** sessionStorage key. Set once the loader has played so it does not replay when coming back from a project page. */
export const LOADER_STORAGE_KEY = 'juzuli:loader-seen'

export const LOADER_ELEMENT_ID = 'site-loader'

export type LoadTask = 'fonts' | 'scene' | 'frame'
export const LOAD_TASKS: readonly LoadTask[] = ['fonts', 'scene', 'frame']

function readFlag(): boolean | null {
  try {
    return window.sessionStorage.getItem(LOADER_STORAGE_KEY) !== null
  } catch {
    return null // storage blocked
  }
}

/** True when this tab session has already played the loader. Storage that is unavailable counts as seen (we cannot remember, so do not replay). */
export function hasSeenLoader(): boolean {
  const flag = readFlag()
  return flag === null ? true : flag
}

export function rememberLoader(): void {
  try {
    window.sessionStorage.setItem(LOADER_STORAGE_KEY, '1')
  } catch {
    /* storage blocked: nothing to remember */
  }
}

export function shouldShowLoader(): boolean {
  return typeof window !== 'undefined' && !hasSeenLoader()
}

/**
 * If the app has not taken the loader over this long after the reveal script
 * showed it (the bundle failed to load, or a script blocker stopped it), the
 * script hides it again so it never covers the page for good.
 */
export const LOADER_FAILSAFE_MS = 6000

/** Attribute the failsafe leaves on the loader, so a very late mount skips it instead of popping it up. */
export const LOADER_FAILSAFE_ATTR = 'data-failsafe'

/**
 * Runs in the prerendered HTML straight after the (hidden) loader element, so
 * a first visit shows the loader from the very first paint, while a return
 * visit and a visitor without JavaScript never see it. If storage is blocked
 * it stays hidden, matching `hasSeenLoader()`. The loader's `data-phase` stays
 * "boot" until React mounts it; if that never happens the failsafe hides it.
 */
export const LOADER_REVEAL_SCRIPT = `try{if(window.sessionStorage.getItem(${JSON.stringify(
  LOADER_STORAGE_KEY,
)})===null){var l=document.getElementById(${JSON.stringify(LOADER_ELEMENT_ID)});if(l){l.hidden=false;setTimeout(function(){if(l.getAttribute('data-phase')==='boot'){l.hidden=true;l.setAttribute(${JSON.stringify(
  LOADER_FAILSAFE_ATTR,
)},'')}},${LOADER_FAILSAFE_MS})}}}catch(e){}`

/** True when the failsafe already hid the loader before the app mounted. */
export function loaderFailsafeFired(): boolean {
  if (typeof document === 'undefined') return false
  return document.getElementById(LOADER_ELEMENT_ID)?.hasAttribute(LOADER_FAILSAFE_ATTR) ?? false
}

// ---- tiny store -----------------------------------------------------------

const listeners = new Set<() => void>()
const tasks = new Set<LoadTask>()
let done = false

function emit() {
  listeners.forEach((l) => l())
}

export function subscribeLoader(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function completeLoadTask(task: LoadTask): void {
  if (tasks.has(task)) return
  tasks.add(task)
  emit()
}

export function completedLoadTasks(): number {
  return tasks.size
}

export function markLoaderDone(): void {
  if (done) return
  done = true
  emit()
}

export function isLoaderDone(): boolean {
  return done
}

/** Test helper: back to a fresh page load. */
export function resetLoaderGate(): void {
  tasks.clear()
  done = false
  listeners.clear()
}

/** True once the hero may reveal: right away when the loader will not show, otherwise after it finishes. */
export function useLoaderGate(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!shouldShowLoader() || isLoaderDone()) {
      setOpen(true)
      return
    }
    return subscribeLoader(() => {
      if (isLoaderDone()) setOpen(true)
    })
  }, [])
  return open
}
