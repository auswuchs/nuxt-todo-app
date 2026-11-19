import {
  applyPatch,
  DeferredTextCommits,
  invertPatch,
  NoteHistory,
  type Patch,
  PatchType,
  type TextFieldCommit,
} from '~/modules/notes/services/History'
import type { Note } from '~/modules/notes/types'
import { createId } from '~/utils/id'

const TODO_FIELD_PREFIX = 'todo:'

export interface NoteEditSession {
  readonly note: Readonly<Note>
  readonly canUndo: boolean
  readonly canRedo: boolean
  setTitle(value: string): void
  setTodoText(id: string, value: string): void
  toggleTodo(id: string): boolean
  removeTodo(id: string): boolean
  addTodo(text: string): boolean
  undo(): boolean
  redo(): boolean
  flushPending(): void
  dispose(): void
}

export interface NoteEditSessionOptions {
  historyLimit?: number
  textCommitDelay?: number
  onChange?: (note: Readonly<Note>) => void
}

export function createNoteEditSession(
  note: Note,
  options: NoteEditSessionOptions = {},
): NoteEditSession {
  let current: Readonly<Note> = note
  let disposed = false

  const history = new NoteHistory(options.historyLimit)
  const onChange = options.onChange
  const deferred = new DeferredTextCommits(
    (commit) => commitDeferred(commit),
    options.textCommitDelay,
  )

  function findTodoIndex(id: string): number {
    return current.todos.findIndex((todo) => todo.id === id)
  }

  function emitChange() {
    if (disposed) return
    onChange?.(current)
  }

  function applyImmediate(patch: Patch) {
    current = applyPatch(current, patch)
    emitChange()
  }

  function commitAndApply(patch: Patch): boolean {
    if (!history.commit(patch)) return false
    current = applyPatch(current, patch)
    emitChange()
    return true
  }

  function commitDeferred(commit: TextFieldCommit) {
    let patch: Patch | null = null

    if (commit.field === 'title') {
      patch = {
        type: PatchType.Title,
        before: commit.before,
        after: commit.after,
      }
    } else if (commit.field.startsWith(TODO_FIELD_PREFIX)) {
      const id = commit.field.slice(TODO_FIELD_PREFIX.length)
      const index = findTodoIndex(id)

      if (index !== -1) {
        patch = {
          type: PatchType.TodoText,
          index,
          before: commit.before,
          after: commit.after,
        }
      }
    }

    if (patch && history.commit(patch)) emitChange()
  }

  function setTitle(value: string) {
    if (disposed || value === current.title) return

    const before = current.title
    applyImmediate({
      type: PatchType.Title,
      before,
      after: value,
    })
    deferred.update('title', before, value)
  }

  function setTodoText(id: string, value: string) {
    if (disposed) return

    const index = findTodoIndex(id)
    if (index === -1) return

    const before = current.todos[index]!.text
    if (before === value) return

    applyImmediate({
      type: PatchType.TodoText,
      index,
      before,
      after: value,
    })
    deferred.update(`${TODO_FIELD_PREFIX}${id}`, before, value)
  }

  function toggleTodo(id: string): boolean {
    if (disposed) return false
    deferred.flush()

    const index = findTodoIndex(id)
    if (index === -1) return false

    const before = current.todos[index]!.done

    return commitAndApply({
      type: PatchType.TodoToggle,
      index,
      before,
      after: !before,
    })
  }

  function removeTodo(id: string): boolean {
    if (disposed) return false
    deferred.flush()

    const index = findTodoIndex(id)
    if (index === -1) return false

    return commitAndApply({
      type: PatchType.TodoRemove,
      index,
      item: current.todos[index]!,
    })
  }

  function addTodo(text: string): boolean {
    if (disposed) return false

    const normalized = text.trim()
    if (normalized === '') return false

    deferred.flush()
    const item = { id: createId(), text: normalized, done: false }
    return commitAndApply({
      type: PatchType.TodoAdd,
      index: current.todos.length,
      item,
    })
  }

  function undo(): boolean {
    if (disposed) return false
    deferred.flush()

    const patch = history.undo()
    if (!patch) return false

    applyImmediate(invertPatch(patch))
    return true
  }

  function redo(): boolean {
    if (disposed) return false
    deferred.flush()

    const patch = history.redo()
    if (!patch) return false

    applyImmediate(patch)
    return true
  }

  function flushPending() {
    if (disposed) return
    deferred.flush()
  }

  function dispose() {
    disposed = true
    deferred.cancel()
  }

  return {
    get note() {
      return current
    },
    get canUndo() {
      return history.canUndo
    },
    get canRedo() {
      return history.canRedo
    },
    setTitle,
    setTodoText,
    toggleTodo,
    removeTodo,
    addTodo,
    undo,
    redo,
    flushPending,
    dispose,
  }
}
