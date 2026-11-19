<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'
import { computed, watch } from 'vue'

import { useDialog } from '~/composables/useDialog'

const { entries, closingIds, dismissedIds, confirm, cancel } = useDialog()

const hasDialogs = computed(() => entries.value.length > 0)
const isScrollLocked = useScrollLock(
  typeof document === 'undefined' ? null : document.body,
)
const topOpenId = computed(() => {
  const open = entries.value.filter((entry) => !closingIds.value.has(entry.id))
  return open.length > 0 ? open[open.length - 1]!.id : null
})

watch(
  hasDialogs,
  (open) => {
    isScrollLocked.value = open
  },
  { immediate: true },
)

function onConfirm(id: number, data?: unknown) {
  confirm(id, data)
}

function onCancel(id: number) {
  cancel(id)
}
</script>

<template>
  <component
    :is="entry.component"
    v-for="entry in entries"
    :key="entry.id"
    v-bind="entry.props"
    :active="entry.id === topOpenId"
    :closing="closingIds.has(entry.id)"
    :restore-focus="!dismissedIds.has(entry.id)"
    @confirm="(data: unknown) => onConfirm(entry.id, data)"
    @cancel="onCancel(entry.id)"
  />
</template>
