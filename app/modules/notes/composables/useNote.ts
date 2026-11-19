import { computed, onBeforeUnmount, onMounted, type Ref, ref, shallowRef } from 'vue'

import { navigateTo } from '#imports'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { useDialog } from '~/composables/useDialog'
import { Routes } from '~/enums/Routes'
import DraftRecoveryDialog from '~/modules/notes/components/DraftRecoveryDialog.vue'
import { clearDraftFor, readDraftFor, writeDraft } from '~/modules/notes/services/DraftStorage'
import { createNoteEditSession, type NoteEditSession } from '~/modules/notes/services/NoteEditSession'
import { getBrowserStorage, NOTES_STORAGE_KEY } from '~/modules/notes/services/Storage'
import { useNotesStore } from '~/modules/notes/store'
import type { DraftRecoveryChoice, Note } from '~/modules/notes/types'
import { createDebouncedWriter } from '~/utils/debouncedWriter'
import { cloneNote, normalizeTitle } from '~/utils/note'

const DRAFT_WRITE_DEBOUNCE_MS = 500
const SAVED_FLASH_MS = 2200

function isTextEntry(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function useNote(noteId: Ref<string>) {
  const notes = useNotesStore()
  const dialog = useDialog()
  const storage = getBrowserStorage()

  const note = ref<Note | null>(null)
  const session = shallowRef<NoteEditSession | null>(null)
  const ready = ref(false)
  const notFound = ref(false)
  const hasChanges = ref(false)
  const savedFlash = ref(false)
  const remoteChanged = ref(false)
  const canUndo = ref(false)
  const canRedo = ref(false)

  const titleEmpty = computed(() => !note.value || note.value.title.trim() === '')

  let draftAllowed = true
  const draftWriter = createDebouncedWriter(() => {
    if (draftAllowed && note.value) writeDraft(note.value, storage)
  }, DRAFT_WRITE_DEBOUNCE_MS)

  let savedFlashTimer: ReturnType<typeof setTimeout> | null = null
  let deletedNoticeShown = false
  let disposed = false

  function syncHistoryFlags() {
    canUndo.value = session.value?.canUndo ?? false
    canRedo.value = session.value?.canRedo ?? false
  }

  function onEditorChange(next: Readonly<Note>) {
    if (disposed) return

    note.value = next
    hasChanges.value = true
    if (draftAllowed) draftWriter.schedule()
    syncHistoryFlags()
  }

  function startSession(next: Note) {
    session.value?.dispose()
    note.value = next
    session.value = createNoteEditSession(next, { onChange: onEditorChange })
    syncHistoryFlags()
  }

  function reconcileRemote(remote: Note) {
    if (remote.updatedAt === note.value?.updatedAt) return

    if (hasChanges.value) {
      remoteChanged.value = true
      return
    }

    startSession(cloneNote(remote))
    hasChanges.value = false
    remoteChanged.value = false
  }

  function discardSession() {
    draftAllowed = false
    draftWriter.cancel()
    clearDraftFor(noteId.value, storage)
    session.value?.dispose()
    session.value = null
    hasChanges.value = false
    remoteChanged.value = false
    canUndo.value = false
    canRedo.value = false
  }

  function flushPending() {
    session.value?.flushPending()
  }

  function onTitleInput(event: Event) {
    session.value?.setTitle((event.target as HTMLInputElement).value)
  }

  function onTitleBlur() {
    flushPending()
  }

  function onTodoTextInput(payload: { id: string, value: string }) {
    session.value?.setTodoText(payload.id, payload.value)
  }

  function toggleTodo(id: string) {
    session.value?.toggleTodo(id)
  }

  function removeTodo(id: string) {
    session.value?.removeTodo(id)
  }

  function addTodo(text: string) {
    session.value?.addTodo(text)
  }

  function undo() {
    session.value?.undo()
  }

  function redo() {
    session.value?.redo()
  }

  function showSavedFlash() {
    savedFlash.value = true
    if (savedFlashTimer !== null) clearTimeout(savedFlashTimer)
    savedFlashTimer = setTimeout(() => {
      savedFlashTimer = null
      savedFlash.value = false
    }, SAVED_FLASH_MS)
  }

  function save() {
    const editor = session.value
    if (!editor) return

    editor.flushPending()
    if (titleEmpty.value) return
    draftWriter.cancel()

    const saved = notes.updateNote({
      ...editor.note,
      title: normalizeTitle(editor.note.title),
    })
    if (!saved) {
      void showDeletedNotice()
      return
    }

    notes.flushPending()
    startSession(saved)
    clearDraftFor(noteId.value, storage)
    hasChanges.value = false
    remoteChanged.value = false
    showSavedFlash()
  }

  function leaveWithoutSaving() {
    discardSession()
    return navigateTo(Routes.Home)
  }

  async function cancelEditing() {
    if (!note.value) return
    flushPending()

    const { ok } = await dialog.reveal(ConfirmDialog, {
      title: 'Отменить изменения?',
      message: 'Несохранённые изменения будут потеряны.',
      confirmLabel: 'Да, отменить',
      cancelLabel: 'Продолжить',
      danger: true,
    })
    if (!ok || disposed) return
    await leaveWithoutSaving()
  }

  async function deleteNote() {
    flushPending()

    const { ok } = await dialog.reveal(ConfirmDialog, {
      title: 'Удалить заметку?',
      message: 'Заметка и все её пункты будут удалены без возможности восстановления.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok || disposed) return

    discardSession()
    notes.removeNote(noteId.value)
    await navigateTo(Routes.Home)
  }

  async function showDeletedNotice() {
    discardSession()

    await dialog.reveal(ConfirmDialog, {
      title: 'Заметка удалена',
      message: 'Эту заметку удалили в другой вкладке. Несохранённые изменения больше некуда сохранить.',
      confirmLabel: 'На главную',
      cancelLabel: null,
    })
    if (disposed) return
    await navigateTo(Routes.Home)
  }

  function onHotkey(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return
    if (event.key.toLowerCase() !== 'z') return
    if (isTextEntry(event.target)) return
    if (!ready.value || !note.value || dialog.isOpen.value) return

    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
  }

  function onPageHide() {
    flushPending()
    if (draftAllowed && hasChanges.value && note.value) {
      draftWriter.cancel()
      writeDraft(note.value, storage)
    }
  }

  function applyRemoteNote() {
    if (!ready.value || notFound.value || deletedNoticeShown || !note.value) return

    const remote = notes.findNote(noteId.value)
    if (!remote) {
      deletedNoticeShown = true
      void showDeletedNotice()
      return
    }

    reconcileRemote(remote)
  }

  function loadRemoteVersion() {
    const remote = notes.findNote(noteId.value)
    if (!remote) {
      deletedNoticeShown = true
      void showDeletedNotice()
      return
    }

    draftWriter.cancel()
    clearDraftFor(noteId.value, storage)
    startSession(cloneNote(remote))
    hasChanges.value = false
    remoteChanged.value = false
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== NOTES_STORAGE_KEY) return
    notes.reloadFromStorage()
    applyRemoteNote()
  }

  async function offerDraftRecovery(draft: Note) {
    const { data, ok } = await dialog.reveal<DraftRecoveryChoice>(DraftRecoveryDialog)
    if (disposed || !ok) return

    // Dismissal keeps the only draft copy; only explicit discard removes it.
    if (data === 'discard') {
      clearDraftFor(noteId.value, storage)
    } else if (data === 'restore') {
      startSession(cloneNote(draft))
      hasChanges.value = true
    }
  }

  onMounted(async () => {
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('storage', onStorage)
    window.addEventListener('keydown', onHotkey)

    const saved = notes.findNote(noteId.value)
    if (!saved) {
      draftAllowed = false
      clearDraftFor(noteId.value, storage)
      notFound.value = true
      ready.value = true
      return
    }

    startSession(cloneNote(saved))
    const draft = readDraftFor(noteId.value, storage)

    if (draft) await offerDraftRecovery(draft)

    if (disposed) return

    const latest = notes.findNote(noteId.value)
    if (!latest) {
      deletedNoticeShown = true
      await showDeletedNotice()
      return
    }

    reconcileRemote(latest)
    ready.value = true
  })

  onBeforeUnmount(() => {
    flushPending()
    if (draftAllowed && (hasChanges.value || canUndo.value) && note.value) {
      draftWriter.cancel()
      writeDraft(note.value, storage)
    }

    disposed = true
    draftWriter.cancel()
    session.value?.dispose()
    session.value = null

    if (savedFlashTimer !== null) {
      clearTimeout(savedFlashTimer)
      savedFlashTimer = null
    }

    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('keydown', onHotkey)
  })

  return {
    note,
    ready,
    notFound,
    hasChanges,
    savedFlash,
    canUndo,
    canRedo,
    titleEmpty,
    remoteChanged,
    title: {
      onInput: onTitleInput,
      onBlur: onTitleBlur,
    },
    todos: {
      onTextInput: onTodoTextInput,
      toggle: toggleTodo,
      remove: removeTodo,
      add: addTodo,
    },
    actions: {
      undo,
      redo,
      save,
      cancel: cancelEditing,
      deleteNote,
      flushPending,
      loadRemoteVersion,
    },
  }
}
