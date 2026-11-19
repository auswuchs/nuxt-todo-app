import { computed, onBeforeUnmount, onMounted } from 'vue'

import { navigateTo } from '#imports'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { useDialog } from '~/composables/useDialog'
import { Routes } from '~/enums/Routes'
import CreateNoteDialog from '~/modules/notes/components/CreateNoteDialog.vue'
import { clearDraftFor } from '~/modules/notes/services/DraftStorage'
import { getBrowserStorage, NOTES_STORAGE_KEY } from '~/modules/notes/services/Storage'
import { useNotesStore } from '~/modules/notes/store'
import type { Note } from '~/modules/notes/types'
import { pluralizeRu } from '~/utils/plural'

export function useNotes() {
  const store = useNotesStore()
  const dialog = useDialog()
  const storage = getBrowserStorage()

  const notes = computed<Note[]>(() => store.notes)
  const isEmpty = computed(() => store.notes.length === 0)
  const countLabel = computed(
    () => pluralizeRu(store.notes.length, ['заметка', 'заметки', 'заметок']),
  )

  function onStorage(event: StorageEvent) {
    if (event.key !== NOTES_STORAGE_KEY) return
    store.reloadFromStorage()
  }

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

  onMounted(() => window.addEventListener('storage', onStorage))
  onBeforeUnmount(() => window.removeEventListener('storage', onStorage))

  return { notes, isEmpty, countLabel, createNote, deleteNote }
}
