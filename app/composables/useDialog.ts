import { type Component, computed, shallowRef } from 'vue'

export interface DialogResult<T> {
  data: T | null
  /** Go-style comma-ok: false means canceled, dismissed or closed by navigation. */
  ok: boolean
}

interface DialogEntry {
  id: number
  component: Component
  props: Record<string, unknown>
  resolve: (result: DialogResult<unknown>) => void
}

const CLOSE_ANIMATION_MS = 180

const entries = shallowRef<DialogEntry[]>([])
const closingIds = shallowRef<Set<number>>(new Set())
const dismissedIds = shallowRef<Set<number>>(new Set())
let nextId = 0

function scheduleRemoval(ids: Set<number>): void {
  setTimeout(() => {
    entries.value = entries.value.filter((entry) => !ids.has(entry.id))
    const nextClosing = new Set(closingIds.value)
    const nextDismissed = new Set(dismissedIds.value)
    for (const id of ids) {
      nextClosing.delete(id)
      nextDismissed.delete(id)
    }
    closingIds.value = nextClosing
    dismissedIds.value = nextDismissed
  }, CLOSE_ANIMATION_MS)
}

function settle(id: number, result: DialogResult<unknown>): void {
  const entry = entries.value.find((item) => item.id === id)
  if (!entry || closingIds.value.has(id)) return

  entry.resolve(result)
  closingIds.value = new Set(closingIds.value).add(id)
  scheduleRemoval(new Set([id]))
}

const dialogs = {
  entries: computed(() => entries.value),
  closingIds: computed(() => closingIds.value),
  dismissedIds: computed(() => dismissedIds.value),
  isOpen: computed(() => entries.value.length > 0),

  reveal<T = void>(
    component: Component,
    props: Record<string, unknown> = {},
  ): Promise<DialogResult<T>> {
    // Promise.withResolvers is unavailable in Safari < 17.4.
    let resolveDialog!: (result: DialogResult<T>) => void
    const promise = new Promise<DialogResult<T>>((resolve) => {
      resolveDialog = resolve
    })

    const entry: DialogEntry = {
      id: ++nextId,
      component,
      props,
      resolve: resolveDialog as (result: DialogResult<unknown>) => void,
    }
    entries.value = [...entries.value, entry]
    return promise
  },

  confirm(id: number, data?: unknown) {
    settle(id, { data: data ?? null, ok: true })
  },

  cancel(id: number) {
    settle(id, { data: null, ok: false })
  },

  // Navigation cleanup: every dialog's cancel path must be non-destructive,
  // because dismissAll cannot distinguish an accidental dismissal from a choice.
  dismissAll() {
    const open = entries.value.filter((entry) => !closingIds.value.has(entry.id))
    if (open.length === 0) return

    const ids = new Set(open.map((entry) => entry.id))
    closingIds.value = new Set([...closingIds.value, ...ids])
    dismissedIds.value = new Set([...dismissedIds.value, ...ids])
    for (const entry of open) entry.resolve({ data: null, ok: false })
    scheduleRemoval(ids)
  },
}

export function useDialog(): typeof dialogs {
  return dialogs
}
