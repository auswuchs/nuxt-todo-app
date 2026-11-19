export const SCHEMA_VERSION = 1 as const

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface Note {
  id: string
  title: string
  todos: TodoItem[]
  createdAt: number
  updatedAt: number
}

export interface NotesEnvelope {
  version: typeof SCHEMA_VERSION
  notes: Note[]
}

export interface DraftEnvelope {
  version: typeof SCHEMA_VERSION
  noteId: string
  note: Note
  updatedAt: number
}

export type DraftRecoveryChoice = 'restore' | 'discard'
