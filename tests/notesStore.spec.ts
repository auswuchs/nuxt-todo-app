import { MemoryStorage } from '@tests/support/memoryStorage'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotesStore } from '~/modules/notes/store'

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('notes store', () => {
  it('exposes repository actions over reactive state', () => {
    const store = useNotesStore()

    const created = store.createNote('Заметка')
    expect(store.notes).toHaveLength(1)
    expect(store.notes[0]!.title).toBe('Заметка')
    expect(store.findNote(created.id)?.title).toBe('Заметка')

    store.removeNote(created.id)
    expect(store.notes).toEqual([])
  })

  it('hydrates notes from storage on creation', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      'notes-todo:v1',
      JSON.stringify({
        version: 1,
        notes: [{
          id: 'note-1',
          title: 'Сохранённая',
          todos: [],
          createdAt: 1,
          updatedAt: 2,
        }],
      }),
    )
    vi.stubGlobal('localStorage', storage)
    setActivePinia(createPinia())

    const store = useNotesStore()

    expect(store.notes[0]!.title).toBe('Сохранённая')
    expect(store.hydrated).toBe(true)
  })
})
