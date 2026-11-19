import { z } from 'zod'

import type { DraftEnvelope, Note, NotesEnvelope, TodoItem } from '~/modules/notes/types'
import { SCHEMA_VERSION } from '~/modules/notes/types'

export const todoItemSchema: z.ZodType<TodoItem> = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
})

export const noteSchema: z.ZodType<Note> = z.object({
  id: z.string(),
  title: z.string(),
  todos: z.array(todoItemSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const notesEnvelopeSchema: z.ZodType<NotesEnvelope> = z.object({
  version: z.literal(SCHEMA_VERSION),
  notes: z.array(noteSchema),
})

export const draftEnvelopeSchema: z.ZodType<DraftEnvelope> = z
  .object({
    version: z.literal(SCHEMA_VERSION),
    noteId: z.string(),
    note: noteSchema,
    updatedAt: z.number(),
  })
  .refine((envelope) => envelope.noteId === envelope.note.id, {
    message: 'noteId must match note.id',
  })
