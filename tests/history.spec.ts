import { describe, expect, it, vi } from 'vitest'

import {
  applyPatch,
  DeferredTextCommits,
  HISTORY_LIMIT,
  invertPatch,
  isNoopPatch,
  NoteHistory,
  type Patch,
  PatchType,
  type TextFieldCommit,
} from '~/modules/notes/services/History'
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

describe('patch application', () => {
  it('applies and inverts a title replacement', () => {
    const patch: Patch = { type: PatchType.Title, before: 'Заметка', after: 'Новая' }
    const applied = applyPatch(note, patch)

    expect(applied.title).toBe('Новая')
    expect(note.title).toBe('Заметка')
    expect(applyPatch(applied, invertPatch(patch))).toEqual(note)
  })

  it('applies and inverts every todo operation', () => {
    const patches: Patch[] = [
      { type: PatchType.TodoAdd, index: 1, item: { id: 'c', text: 'Третий', done: false } },
      { type: PatchType.TodoRemove, index: 0, item: note.todos[0]! },
      { type: PatchType.TodoText, index: 0, before: 'Первый', after: 'Обновлённый' },
      { type: PatchType.TodoToggle, index: 0, before: false, after: true },
    ]

    for (const patch of patches) {
      const applied = applyPatch(note, patch)
      expect(applyPatch(applied, invertPatch(patch))).toEqual(note)
    }
  })

  it('does not mutate the input note', () => {
    const snapshot = structuredClone(note)
    applyPatch(note, { type: PatchType.TodoToggle, index: 0, before: false, after: true })
    applyPatch(note, { type: PatchType.TodoRemove, index: 0, item: note.todos[0]! })
    expect(note).toEqual(snapshot)
  })

  it('detects no-op text patches', () => {
    expect(isNoopPatch({ type: PatchType.Title, before: 'a', after: 'a' })).toBe(true)
    expect(isNoopPatch({ type: PatchType.TodoText, index: 0, before: 'a', after: 'a' })).toBe(true)
    expect(isNoopPatch({ type: PatchType.Title, before: 'a', after: 'b' })).toBe(false)
    expect(isNoopPatch({ type: PatchType.TodoAdd, index: 0, item: note.todos[0]! })).toBe(false)
  })
})

describe('note history', () => {
  it('stores patches instead of note snapshots', () => {
    const history = new NoteHistory()
    history.commit({ type: PatchType.Title, before: 'Заметка', after: 'Новая' })

    expect(history.past).toHaveLength(1)
    expect(history.past[0]).toEqual({ type: PatchType.Title, before: 'Заметка', after: 'Новая' })
    expect(history.past[0]).not.toHaveProperty('todos')
  })

  it('records a toggle and an add as two atomic entries', () => {
    const history = new NoteHistory()
    history.commit({ type: PatchType.TodoToggle, index: 0, before: false, after: true })
    history.commit({
      type: PatchType.TodoAdd,
      index: 2,
      item: { id: 'c', text: 'Третий', done: false },
    })

    expect(history.past).toHaveLength(2)
  })

  it('keeps at most 50 entries', () => {
    const history = new NoteHistory()
    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) {
      history.commit({ type: PatchType.Title, before: `v${index}`, after: `v${index + 1}` })
    }

    expect(history.past).toHaveLength(HISTORY_LIMIT)
    expect(history.past[0]).toEqual({ type: PatchType.Title, before: 'v5', after: 'v6' })
    expect(history.past[HISTORY_LIMIT - 1]).toEqual({
      type: PatchType.Title,
      before: 'v54',
      after: 'v55',
    })
  })

  it('undoes and redoes patches, clearing redo on a new commit', () => {
    const history = new NoteHistory()
    const toggle: Patch = { type: PatchType.TodoToggle, index: 0, before: false, after: true }
    history.commit(toggle)

    expect(history.undo()).toEqual(toggle)
    expect(history.canRedo).toBe(true)
    expect(history.redo()).toEqual(toggle)
    expect(history.canRedo).toBe(false)

    history.undo()
    history.commit({ type: PatchType.Title, before: 'Заметка', after: 'Другая' })
    expect(history.future).toHaveLength(0)
    expect(history.canRedo).toBe(false)
  })

  it('skips no-op commits and preserves redo', () => {
    const history = new NoteHistory()
    history.commit({ type: PatchType.TodoToggle, index: 0, before: false, after: true })
    history.undo()

    expect(history.commit({ type: PatchType.Title, before: 'a', after: 'a' })).toBe(false)
    expect(history.canRedo).toBe(true)
  })

  it('resets both branches', () => {
    const history = new NoteHistory()
    history.commit({ type: PatchType.TodoToggle, index: 0, before: false, after: true })
    history.undo()

    history.reset()

    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })
})

describe('deferred text commits', () => {
  function setup() {
    const commits: TextFieldCommit[] = []
    const deferred = new DeferredTextCommits((commit) => commits.push(commit), 500)
    return { commits, deferred }
  }

  it('coalesces continuous typing in one field into one commit', () => {
    const { commits, deferred } = setup()

    deferred.update('title', '', 'З')
    deferred.update('title', 'З', 'За')
    deferred.update('title', 'За', 'Зам')
    expect(commits).toHaveLength(0)

    deferred.flush()
    expect(commits).toEqual([{ field: 'title', before: '', after: 'Зам' }])
  })

  it('commits after a 500 ms pause', () => {
    vi.useFakeTimers()
    const { commits, deferred } = setup()

    deferred.update('title', '', 'Текст')
    vi.advanceTimersByTime(499)
    expect(commits).toHaveLength(0)

    vi.advanceTimersByTime(1)
    expect(commits).toHaveLength(1)
    vi.useRealTimers()
  })

  it('flushes the previous field before switching to another one', () => {
    const { commits, deferred } = setup()

    deferred.update('title', '', 'Заголовок')
    deferred.update('todo:a', '', 'Пункт')

    expect(commits).toEqual([{ field: 'title', before: '', after: 'Заголовок' }])
    deferred.flush()
    expect(commits[1]).toEqual({ field: 'todo:a', before: '', after: 'Пункт' })
  })

  it('skips a no-op, such as native undo returning to the committed value', () => {
    const { commits, deferred } = setup()

    deferred.update('title', 'Исходный', 'Изменённый')
    deferred.update('title', 'Изменённый', 'Исходный')
    deferred.flush()

    expect(commits).toHaveLength(0)
  })

  it('cancel discards pending text', () => {
    const { commits, deferred } = setup()

    deferred.update('title', '', 'Текст')
    deferred.cancel()
    deferred.flush()

    expect(commits).toHaveLength(0)
  })
})
