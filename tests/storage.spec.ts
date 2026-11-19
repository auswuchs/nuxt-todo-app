import { MemoryStorage } from '@tests/support/memoryStorage'
import { describe, expect, it } from 'vitest'

import { clearDraftFor, DRAFT_STORAGE_KEY, readDraftFor, writeDraft } from '~/modules/notes/services/DraftStorage'
import {
  NOTES_STORAGE_KEY,
  parseNotes,
  readNotes,
  serializeNotes,
  writeNotes,
} from '~/modules/notes/services/Storage'
import type { Note } from '~/modules/notes/types'

const note: Note = {
  id: 'note-1',
  title: 'Покупки',
  todos: [
    { id: 'todo-1', text: 'Молоко', done: false },
    { id: 'todo-2', text: 'Хлеб', done: true },
  ],
  createdAt: 1_000,
  updatedAt: 2_000,
}

describe('notes storage', () => {
  it('round-trips versioned notes', () => {
    const storage = new MemoryStorage()
    writeNotes([note], storage)

    const raw = storage.getItem(NOTES_STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual({ version: 1, notes: [note] })
    expect(readNotes(storage)).toEqual([note])
  })

  it('serializes the envelope with the schema version', () => {
    expect(JSON.parse(serializeNotes([note]))).toEqual({ version: 1, notes: [note] })
  })

  it('starts empty when nothing is stored', () => {
    expect(readNotes(new MemoryStorage())).toEqual([])
    expect(parseNotes(null)).toEqual([])
  })

  it('ignores an unknown schema version', () => {
    const storage = new MemoryStorage()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 2, notes: [note] }))
    expect(readNotes(storage)).toEqual([])
  })

  it('contains corrupted JSON', () => {
    const storage = new MemoryStorage()
    storage.setItem(NOTES_STORAGE_KEY, '{not-json')
    expect(readNotes(storage)).toEqual([])
  })

  it('ignores an invalid note shape', () => {
    const storage = new MemoryStorage()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, notes: [{ id: 'broken' }] }))
    expect(readNotes(storage)).toEqual([])
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, notes: 'nope' }))
    expect(readNotes(storage)).toEqual([])
  })

  it('accepts a valid empty list', () => {
    const storage = new MemoryStorage()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, notes: [] }))
    expect(readNotes(storage)).toEqual([])
  })
})

describe('draft storage', () => {
  it('stores and reads a draft for its note', () => {
    const storage = new MemoryStorage()
    writeDraft(note, storage)

    expect(readDraftFor(note.id, storage)).toEqual(note)
    expect(JSON.parse(storage.getItem(DRAFT_STORAGE_KEY)!)).toMatchObject({
      version: 1,
      noteId: note.id,
    })
  })

  it('does not return a draft that belongs to another note', () => {
    const storage = new MemoryStorage()
    writeDraft(note, storage)

    expect(readDraftFor('other-note', storage)).toBeNull()
    clearDraftFor('other-note', storage)
    expect(readDraftFor(note.id, storage)).toEqual(note)
  })

  it('clears the draft for the matching note', () => {
    const storage = new MemoryStorage()
    writeDraft(note, storage)

    clearDraftFor(note.id, storage)
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
  })

  it('ignores invalid and mismatched draft payloads', () => {
    const storage = new MemoryStorage()
    storage.setItem(DRAFT_STORAGE_KEY, '{broken')
    expect(readDraftFor(note.id, storage)).toBeNull()

    storage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: 1, noteId: 'other', note, updatedAt: 1 }),
    )
    expect(readDraftFor(note.id, storage)).toBeNull()
  })
})
