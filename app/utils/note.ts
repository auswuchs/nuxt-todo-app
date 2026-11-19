import type { Note } from '~/modules/notes/types'

export function normalizeTitle(title: string): string {
  return title.trim()
}

export function cloneNote(note: Note): Note {
  return {
    ...note,
    todos: note.todos.map((todo) => ({ ...todo })),
  }
}
