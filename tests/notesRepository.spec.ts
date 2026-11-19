import { MemoryStorage } from '@tests/support/memoryStorage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createNotesRepository, NOTES_WRITE_DEBOUNCE_MS } from '~/modules/notes/services/NotesRepository'
import { NOTES_STORAGE_KEY, readNotes } from '~/modules/notes/services/Storage'
import type { Note } from '~/modules/notes/types'
import { createDebouncedWriter } from '~/utils/debouncedWriter'

const existingNote: Note = {
  id: 'note-1',
  title: 'Старая заметка',
  todos: [{ id: 'todo-1', text: 'Пункт', done: false }],
  createdAt: 100,
  updatedAt: 200,
}

function createHarness() {
  const notes = ref<Note[]>([])
  const hydrated = ref(false)
  const storage = new MemoryStorage()
  const repository = createNotesRepository({ notes, hydrated }, storage)
  return { notes, hydrated, storage, repository }
}

describe('notes repository', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hydrates the state from valid versioned storage', () => {
    const { notes, hydrated, storage, repository } = createHarness()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, notes: [existingNote] }))

    repository.hydrate()

    expect(notes.value).toEqual([existingNote])
    expect(hydrated.value).toBe(true)
  })

  it('starts with an empty list on corrupted data', () => {
    const { notes, hydrated, storage, repository } = createHarness()
    storage.setItem(NOTES_STORAGE_KEY, '{broken')

    repository.hydrate()

    expect(notes.value).toEqual([])
    expect(hydrated.value).toBe(true)
  })

  it('starts with an empty list on an unknown schema version', () => {
    const { notes, storage, repository } = createHarness()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 99, notes: [existingNote] }))

    repository.hydrate()

    expect(notes.value).toEqual([])
  })

  it('creates a note with a trimmed title and persists it immediately', () => {
    const { notes, storage, repository } = createHarness()
    repository.hydrate()

    const note = repository.createNote('  Покупки  ')

    expect(note.title).toBe('Покупки')
    expect(notes.value).toHaveLength(1)
    expect(readNotes(storage)[0]!.title).toBe('Покупки')
  })

  it('rejects an empty title', () => {
    const { notes, repository } = createHarness()
    repository.hydrate()

    expect(() => repository.createNote('   ')).toThrowError('Note title is required')
    expect(notes.value).toEqual([])
  })

  it('debounces updates instead of writing on every change', () => {
    const { notes, storage, repository } = createHarness()
    repository.createNote('Заметка')
    const created = notes.value[0]!
    repository.updateNote({ ...created, title: 'Изменённая' })

    expect(readNotes(storage)[0]!.title).toBe('Заметка')

    vi.advanceTimersByTime(NOTES_WRITE_DEBOUNCE_MS - 1)
    expect(readNotes(storage)[0]!.title).toBe('Заметка')

    vi.advanceTimersByTime(1)
    expect(readNotes(storage)[0]!.title).toBe('Изменённая')
  })

  it('flushes a pending write without waiting for the debounce', () => {
    const { notes, storage, repository } = createHarness()
    repository.createNote('Заметка')
    const created = notes.value[0]!
    repository.updateNote({ ...created, title: 'Срочно' })

    repository.flushPending()

    expect(readNotes(storage)[0]!.title).toBe('Срочно')
  })

  it('removes a note and persists the deletion immediately', () => {
    const { notes, storage, repository } = createHarness()
    const note = repository.createNote('Удаляемая')

    repository.removeNote(note.id)

    expect(notes.value).toEqual([])
    expect(readNotes(storage)).toEqual([])
  })

  it('returns null and writes nothing when updating a missing note', () => {
    const { notes, storage, repository } = createHarness()
    repository.hydrate()

    const result = repository.updateNote({ ...existingNote, title: 'Изменённая' })
    vi.advanceTimersByTime(NOTES_WRITE_DEBOUNCE_MS)

    expect(result).toBeNull()
    expect(notes.value).toEqual([])
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBeNull()
  })

  it('does not share note objects with callers', () => {
    const { notes, repository } = createHarness()

    const created = repository.createNote('Заметка')
    created.todos.push({ id: 'todo-2', text: 'Лишний', done: false })
    expect(notes.value[0]!.todos).toEqual([])

    const source = notes.value[0]!
    const updated = repository.updateNote({
      ...source,
      todos: [{ id: 'todo-1', text: 'Пункт', done: false }],
    })
    expect(updated).not.toBeNull()

    updated!.todos[0]!.text = 'Изменённый'
    expect(notes.value[0]!.todos[0]!.text).toBe('Пункт')
  })

  it('reloads state from storage after another tab wrote it', () => {
    const { notes, storage, repository } = createHarness()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, notes: [existingNote] }))

    repository.reloadFromStorage()

    expect(notes.value).toEqual([existingNote])
  })
})

describe('debounced writer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes once after the delay and can be flushed or canceled', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const writer = createDebouncedWriter(write, 100)

    writer.schedule()
    writer.schedule()
    vi.advanceTimersByTime(99)
    expect(write).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(write).toHaveBeenCalledTimes(1)

    writer.schedule()
    writer.flush()
    expect(write).toHaveBeenCalledTimes(2)

    writer.schedule()
    writer.cancel()
    vi.advanceTimersByTime(100)
    expect(write).toHaveBeenCalledTimes(2)
  })
})
