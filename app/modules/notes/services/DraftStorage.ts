import { draftEnvelopeSchema } from '~/modules/notes/services/Schemas'
import type { DraftEnvelope, Note } from '~/modules/notes/types'
import { SCHEMA_VERSION } from '~/modules/notes/types'

export const DRAFT_STORAGE_KEY = 'notes-todo:draft:v1'

function readEnvelope(storage: Storage | null): DraftEnvelope | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY)
    if (raw === null) return null
    const result = draftEnvelopeSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function readDraftFor(noteId: string, storage: Storage | null): Note | null {
  const envelope = readEnvelope(storage)
  return envelope && envelope.noteId === noteId ? envelope.note : null
}

export function writeDraft(note: Note, storage: Storage | null) {
  if (!storage) return
  const envelope: DraftEnvelope = {
    version: SCHEMA_VERSION,
    noteId: note.id,
    note,
    updatedAt: Date.now(),
  }
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    // Storage can be unavailable (quota, private mode); the draft is best-effort.
  }
}

export function clearDraftFor(noteId: string, storage: Storage | null) {
  if (!storage) return
  const envelope = readEnvelope(storage)
  if (envelope && envelope.noteId !== noteId) return
  try {
    storage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    // Ignore storage failures on cleanup.
  }
}
