import type { Note, TodoItem } from '~/modules/notes/types'

export enum PatchType {
  Title = 'title',
  TodoAdd = 'todo.add',
  TodoRemove = 'todo.remove',
  TodoText = 'todo.text',
  TodoToggle = 'todo.toggle',
}

export type Patch
  = | { type: PatchType.Title, before: string, after: string }
    | { type: PatchType.TodoAdd, index: number, item: TodoItem }
    | { type: PatchType.TodoRemove, index: number, item: TodoItem }
    | { type: PatchType.TodoText, index: number, before: string, after: string }
    | { type: PatchType.TodoToggle, index: number, before: boolean, after: boolean }

type PatchByType<K extends PatchType> = Extract<Patch, { type: K }>

const PATCH_INVERTERS: { [K in PatchType]: (patch: PatchByType<K>) => Patch } = {
  [PatchType.Title]: (patch) => ({
    type: PatchType.Title,
    before: patch.after,
    after: patch.before,
  }),
  [PatchType.TodoAdd]: (patch) => ({
    type: PatchType.TodoRemove,
    index: patch.index,
    item: patch.item,
  }),
  [PatchType.TodoRemove]: (patch) => ({
    type: PatchType.TodoAdd,
    index: patch.index,
    item: patch.item,
  }),
  [PatchType.TodoText]: (patch) => ({
    type: PatchType.TodoText,
    index: patch.index,
    before: patch.after,
    after: patch.before,
  }),
  [PatchType.TodoToggle]: (patch) => ({
    type: PatchType.TodoToggle,
    index: patch.index,
    before: patch.after,
    after: patch.before,
  }),
}

export const HISTORY_LIMIT = 50

export function invertPatch(patch: Patch): Patch {
  const invertFn = PATCH_INVERTERS[patch.type] as (patch: Patch) => Patch
  return invertFn(patch)
}

export function applyPatch(note: Note, patch: Patch): Note {
  switch (patch.type) {
    case PatchType.Title:
      return { ...note, title: patch.after }
    case PatchType.TodoAdd: {
      const todos = note.todos.slice()
      todos.splice(patch.index, 0, patch.item)
      return { ...note, todos }
    }
    case PatchType.TodoRemove: {
      const todos = note.todos.slice()
      todos.splice(patch.index, 1)
      return { ...note, todos }
    }
    case PatchType.TodoText: {
      const item = note.todos[patch.index]
      if (!item) return note
      const todos = note.todos.slice()
      todos[patch.index] = { ...item, text: patch.after }
      return { ...note, todos }
    }
    case PatchType.TodoToggle: {
      const item = note.todos[patch.index]
      if (!item) return note
      const todos = note.todos.slice()
      todos[patch.index] = { ...item, done: patch.after }
      return { ...note, todos }
    }
  }
}

export function isNoopPatch(patch: Patch): boolean {
  switch (patch.type) {
    case PatchType.Title:
    case PatchType.TodoText:
      return patch.before === patch.after
    case PatchType.TodoToggle:
      return patch.before === patch.after
    default:
      return false
  }
}

export class NoteHistory {
  private pastPatches: Patch[] = []
  private futurePatches: Patch[] = []

  constructor(private readonly limit: number = HISTORY_LIMIT) {}

  get past(): readonly Patch[] {
    return this.pastPatches
  }

  get future(): readonly Patch[] {
    return this.futurePatches
  }

  get canUndo(): boolean {
    return this.pastPatches.length > 0
  }

  get canRedo(): boolean {
    return this.futurePatches.length > 0
  }

  commit(patch: Patch): boolean {
    if (isNoopPatch(patch)) return false
    this.pastPatches.push(patch)
    if (this.pastPatches.length > this.limit) this.pastPatches.shift()
    this.futurePatches = []
    return true
  }

  undo(): Patch | null {
    const patch = this.pastPatches.pop()
    if (!patch) return null
    this.futurePatches.push(patch)
    return patch
  }

  redo(): Patch | null {
    const patch = this.futurePatches.pop()
    if (!patch) return null
    this.pastPatches.push(patch)
    return patch
  }

  reset() {
    this.pastPatches = []
    this.futurePatches = []
  }
}

export interface TextFieldCommit {
  field: string
  before: string
  after: string
}

export type TextCommitHandler = (commit: TextFieldCommit) => void

export const TEXT_COMMIT_DEBOUNCE_MS = 500

export class DeferredTextCommits {
  private pending: TextFieldCommit | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly onCommit: TextCommitHandler,
    private readonly delay: number = TEXT_COMMIT_DEBOUNCE_MS,
  ) {}

  update(field: string, before: string, after: string) {
    if (this.pending && this.pending.field === field) {
      this.pending.after = after
    } else {
      this.flush()
      this.pending = { field, before, after }
    }
    this.restartTimer()
  }

  flush() {
    this.clearTimer()
    const pending = this.pending
    this.pending = null
    if (pending && pending.before !== pending.after) this.onCommit(pending)
  }

  cancel() {
    this.clearTimer()
    this.pending = null
  }

  private restartTimer() {
    this.clearTimer()
    this.timer = setTimeout(() => {
      this.timer = null
      const pending = this.pending
      this.pending = null
      if (pending && pending.before !== pending.after) this.onCommit(pending)
    }, this.delay)
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
