import { notesEnvelopeSchema } from '~/modules/notes/services/Schemas'
import type { Note } from '~/modules/notes/types'
import { SCHEMA_VERSION } from '~/modules/notes/types'

export const NOTES_STORAGE_KEY = 'notes-todo:v1'

export function getBrowserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function parseNotes(raw: string | null): Note[] {
  if (raw === null) return []

  try {
    const result = notesEnvelopeSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data.notes : []
  } catch {
    return []
  }
}

export function serializeNotes(notes: Note[]): string {
  return JSON.stringify({ version: SCHEMA_VERSION, notes })
}

export function readNotes(storage: Storage | null = getBrowserStorage()): Note[] {
  if (!storage) return []
  try {
    return parseNotes(storage.getItem(NOTES_STORAGE_KEY))
  } catch {
    return []
  }
}

export function writeNotes(notes: Note[], storage: Storage | null = getBrowserStorage()) {
  if (!storage) return
  try {
    storage.setItem(NOTES_STORAGE_KEY, serializeNotes(notes))
  } catch {
    // Storage can be unavailable (quota, private mode); editing stays in memory.
  }
}
