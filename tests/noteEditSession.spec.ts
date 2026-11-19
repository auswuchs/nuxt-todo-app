import { afterEach, describe, expect, it, vi } from 'vitest'

import { createNoteEditSession } from '~/modules/notes/services/NoteEditSession'
import type { Note } from '~/modules/notes/types'

const note: Note = {
  id: 'note-1',
  title: 'Заметка',
  todos: [
    { id: 'a', text: 'Первый', done: false },
    { id: 'b', text: 'Второй', done: true },
  ],
  createdAt: 1,
  updatedAt: 2,
}

function createSession(source: Note = note) {
  const changes: Readonly<Note>[] = []
  const session = createNoteEditSession(structuredClone(source), {
    onChange: (next) => changes.push(next),
    textCommitDelay: 500,
  })
  return { session, changes }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('note edit session', () => {
  it('applies title input immediately and commits one history entry on flush', () => {
    const { session, changes } = createSession()

    session.setTitle('З')
    session.setTitle('За')
    session.setTitle('Зам')

    expect(session.note.title).toBe('Зам')
    expect(session.canUndo).toBe(false)
    expect(changes).toHaveLength(3)

    session.flushPending()

    expect(session.canUndo).toBe(true)
    expect(session.undo()).toBe(true)
    expect(session.note.title).toBe('Заметка')
    expect(session.redo()).toBe(true)
    expect(session.note.title).toBe('Зам')
  })

  it('commits text after the debounce delay', () => {
    vi.useFakeTimers()
    const { session } = createSession()

    session.setTitle('Изменённая')
    vi.advanceTimersByTime(499)
    expect(session.canUndo).toBe(false)

    vi.advanceTimersByTime(1)
    expect(session.canUndo).toBe(true)
  })

  it('keeps toggle, add and remove as atomic entries', () => {
    const { session } = createSession()

    expect(session.toggleTodo('a')).toBe(true)
    expect(session.note.todos[0]!.done).toBe(true)

    expect(session.addTodo('Третий')).toBe(true)
    expect(session.note.todos).toHaveLength(3)
    const addedId = session.note.todos[2]!.id

    expect(session.removeTodo('b')).toBe(true)
    expect(session.note.todos.map((todo) => todo.id)).toEqual(['a', addedId])

    expect(session.undo()).toBe(true)
    expect(session.note.todos.map((todo) => todo.id)).toEqual(['a', 'b', addedId])
    expect(session.undo()).toBe(true)
    expect(session.note.todos).toHaveLength(2)
    expect(session.undo()).toBe(true)
    expect(session.note.todos[0]!.done).toBe(false)
  })

  it('flushes pending text before removing another item', () => {
    const { session } = createSession()

    session.setTodoText('b', 'Второй обновлён')
    expect(session.removeTodo('a')).toBe(true)

    expect(session.note.todos[0]!.text).toBe('Второй обновлён')

    expect(session.undo()).toBe(true)
    expect(session.note.todos[0]!.id).toBe('a')
    expect(session.undo()).toBe(true)
    expect(session.note.todos[1]!.text).toBe('Второй')
  })

  it('rejects empty todo text authoritatively', () => {
    const { session } = createSession()

    expect(session.addTodo('   ')).toBe(false)
    expect(session.note.todos).toHaveLength(2)
  })

  it('does not emit changes for no-op input or after dispose', () => {
    const { session, changes } = createSession()

    session.setTitle(note.title)
    session.setTodoText('a', 'Первый')
    expect(changes).toHaveLength(0)

    session.dispose()
    session.setTitle('После dispose')
    session.flushPending()

    expect(changes).toHaveLength(0)
  })
})
