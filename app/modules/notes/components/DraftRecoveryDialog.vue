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
  gap: $space-3;

  &__title {
    font-size: $text-lg;
    line-height: 1.25;
  }

  &__message {
    font-size: $text-base;
    line-height: $line-snug;
    color: $color-text-soft;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: $space-3;
    margin-top: $space-2;

    @include mobile {
      flex-direction: column-reverse;

      :deep(.app-button) {
        width: 100%;
      }
    }
  }
}
</style>
