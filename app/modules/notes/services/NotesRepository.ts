import type { Ref } from 'vue'

import { readNotes, writeNotes } from '~/modules/notes/services/Storage'
import type { Note } from '~/modules/notes/types'
import { createDebouncedWriter } from '~/utils/debouncedWriter'
import { createId } from '~/utils/id'
import { cloneNote, normalizeTitle } from '~/utils/note'

export const NOTES_WRITE_DEBOUNCE_MS = 400

export interface NotesState {
  notes: Ref<Note[]>
  hydrated: Ref<boolean>
}

export interface NotesRepository {
  hydrate(): void
  findNote(id: string): Note | undefined
  createNote(title: string): Note
  updateNote(note: Note): Note | null
  removeNote(id: string): void
  reloadFromStorage(): void
  flushPending(): void
}

export function createNotesRepository(
  state: NotesState,
  storage: Storage | null,
  delayMs: number = NOTES_WRITE_DEBOUNCE_MS,
): NotesRepository {
  const writer = createDebouncedWriter(() => writeNotes(state.notes.value, storage), delayMs)

  function hydrate() {
    if (state.hydrated.value) return
    state.notes.value = readNotes(storage)
    state.hydrated.value = true
  }

  function persistNow() {
    writer.cancel()
    writeNotes(state.notes.value, storage)
  }

  function findNote(id: string): Note | undefined {
    hydrate()
    return state.notes.value.find((note) => note.id === id)
  }

  function createNote(title: string): Note {
    hydrate()
    const normalized = normalizeTitle(title)
    if (normalized === '') throw new Error('Note title is required')

    const now = Date.now()
    const note: Note = {
      id: createId(),
      title: normalized,
      todos: [],
      createdAt: now,
      updatedAt: now,
    }
    state.notes.value = [note, ...state.notes.value]
    persistNow()
    return cloneNote(note)
  }

  function updateNote(note: Note): Note | null {
    hydrate()
    if (!state.notes.value.some((existing) => existing.id === note.id)) return null

    const updated = cloneNote(note)
    updated.updatedAt = Date.now()
    state.notes.value = state.notes.value.map((existing) =>
      existing.id === updated.id ? updated : existing,
    )
    writer.schedule()
    return cloneNote(updated)
  }

  function removeNote(id: string) {
    hydrate()
    const next = state.notes.value.filter((note) => note.id !== id)
    if (next.length === state.notes.value.length) return
    state.notes.value = next
    persistNow()
  }

  function reloadFromStorage() {
    writer.cancel()
    state.notes.value = readNotes(storage)
    state.hydrated.value = true
  }

  return {
    hydrate,
    findNote,
    createNote,
    updateNote,
    removeNote,
    reloadFromStorage,
    flushPending: writer.flush,
  }
}
