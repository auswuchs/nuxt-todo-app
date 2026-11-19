<script setup lang="ts">
import { useId } from 'vue'

import type { DraftRecoveryChoice } from '~/modules/notes/types'

type Props = {
  active?: boolean
  closing?: boolean
}

type Emits = {
  confirm: [choice: DraftRecoveryChoice]
  cancel: []
}

withDefaults(defineProps<Props>(), {
  active: true,
  closing: false,
})

const emit = defineEmits<Emits>()
const titleId = useId()
const messageId = useId()
</script>

<template>
  <AppModal
    :active="active"
    :closing="closing"
    :labelled-by="titleId"
    :described-by="messageId"
    size="sm"
    @cancel="emit('cancel')"
  >
    <div class="draft-recovery">
      <h2
        :id="titleId"
        class="draft-recovery__title"
      >
        Восстановить черновик?
      </h2>
      <p
        :id="messageId"
        class="draft-recovery__message"
      >
        Найдены несохранённые изменения этой заметки. Восстановить их?
      </p>
      <div class="draft-recovery__actions">
        <AppButton
          variant="secondary"
          @click="emit('confirm', 'discard')"
        >
          Отбросить
        </AppButton>
        <AppButton
          variant="primary"
          data-autofocus
          @click="emit('confirm', 'restore')"
        >
          Восстановить
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.draft-recovery {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-size: 20px;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  &__message {
    font-size: 15px;
    color: $color-text-soft;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;

    @include mobile {
      flex-direction: column-reverse;

      :deep(.app-button) {
        width: 100%;
      }
    }
  }
}
</style>
