<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import { useDialog } from '~/composables/useDialog'
import { useNotesStore } from '~/modules/notes/store'

const notes = useNotesStore()
const dialog = useDialog()
const router = useRouter()

router.afterEach(() => dialog.dismissAll())

onMounted(() => {
  window.addEventListener('pagehide', notes.flushPending)
})

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', notes.flushPending)
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <DialogHost />
</template>
