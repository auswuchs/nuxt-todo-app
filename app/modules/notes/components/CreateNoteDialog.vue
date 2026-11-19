<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import { useDialog } from '~/composables/useDialog'

type Props = {
  active?: boolean
  closing?: boolean
}

type Emits = {
  confirm: [title: string]
  cancel: []
}

withDefaults(defineProps<Props>(), {
  active: true,
  closing: false,
})

const emit = defineEmits<Emits>()

const dialog = useDialog()
const titleId = useId()

const title = ref('')
const isTitleEmpty = computed(() => title.value.trim() === '')

function submit() {
  if (isTitleEmpty.value) return
  emit('confirm', title.value.trim())
}

async function requestCancel() {
  if (isTitleEmpty.value) {
    emit('cancel')
    return
  }

  const { ok } = await dialog.reveal(ConfirmDialog, {
    title: 'Отменить создание?',
    message: 'Введённое название не сохранится.',
    confirmLabel: 'Отменить создание',
    cancelLabel: 'Продолжить',
    danger: true,
  })
  if (!ok) return
  emit('cancel')
}
</script>

<template>
  <AppModal
    :active="active"
    :closing="closing"
    :labelled-by="titleId"
    size="sm"
    @cancel="requestCancel"
  >
    <form
      class="create-note"
      novalidate
      @submit.prevent="submit"
    >
      <h2
        :id="titleId"
        class="create-note__title"
      >
        Новая заметка
      </h2>

      <label class="field">
        <span class="field__label">Название</span>
        <input
          v-model="title"
          class="text-input"
          type="text"
          maxlength="120"
          placeholder="Например, Покупки"
          data-autofocus
        />
      </label>

      <div class="create-note__actions">
        <AppButton
          variant="secondary"
          @click="requestCancel"
        >
          Отмена
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          :disabled="isTitleEmpty"
        >
          Создать
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped lang="scss">
.create-note {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__title {
    font-size: 20px;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;

    @include mobile {
      flex-direction: column-reverse;

      :deep(.app-button) {
        width: 100%;
      }
    }
  }
}
</style>
