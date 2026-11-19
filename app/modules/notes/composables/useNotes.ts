import { computed } from 'vue'

import { navigateTo } from '#imports'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { useDialog } from '~/composables/useDialog'
import { Routes } from '~/enums/Routes'
import CreateNoteDialog from '~/modules/notes/components/CreateNoteDialog.vue'
import { clearDraftFor } from '~/modules/notes/services/DraftStorage'
import { getBrowserStorage } from '~/modules/notes/services/Storage'
import { useNotesStore } from '~/modules/notes/store'
import type { Note } from '~/modules/notes/types'

export function useNotes() {
  const store = useNotesStore()
  const dialog = useDialog()
  const storage = getBrowserStorage()

  const notes = computed<Note[]>(() => store.notes)
  const isEmpty = computed(() => store.notes.length === 0)

  async function createNote() {
    const { data, ok } = await dialog.reveal<string>(CreateNoteDialog)
    if (!ok) return

    const title = data?.trim() ?? ''
    if (title === '') return

    const note = store.createNote(title)
    await navigateTo(Routes.NoteDetail(note.id))
  }

  async function deleteNote(note: Note) {
    const { ok } = await dialog.reveal(ConfirmDialog, {
      title: 'Удалить заметку?',
      message: `«${note.title}» и все её пункты будут удалены без возможности восстановления.`,
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return

    store.removeNote(note.id)
    clearDraftFor(note.id, storage)
  }

  return { notes, isEmpty, createNote, deleteNote }
}
