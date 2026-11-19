import { defineStore } from 'pinia'
import { ref } from 'vue'

import { createNotesRepository } from '~/modules/notes/services/NotesRepository'
import { getBrowserStorage } from '~/modules/notes/services/Storage'
import type { Note } from '~/modules/notes/types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const hydrated = ref(false)
  const repository = createNotesRepository({ notes, hydrated }, getBrowserStorage())

  repository.hydrate()

  return {
    notes,
    hydrated,
    ...repository,
  }
})
