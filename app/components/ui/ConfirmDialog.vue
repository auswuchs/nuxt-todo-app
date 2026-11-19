<script setup lang="ts">
import { computed, useId } from 'vue'

type Props = {
  active?: boolean
  closing?: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string | null
  danger?: boolean
}

type Emits = {
  confirm: []
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  closing: false,
  message: undefined,
  confirmLabel: 'Подтвердить',
  cancelLabel: 'Отмена',
  danger: false,
})

const emit = defineEmits<Emits>()

const titleId = useId()
const messageId = useId()

const hasCancel = computed(() => props.cancelLabel !== null)
const cancelAutofocus = computed(() => (props.danger ? '' : undefined))
const confirmAutofocus = computed(() =>
  !props.danger || props.cancelLabel === null ? '' : undefined,
)
</script>

<template>
  <AppModal
    :active="active"
    :closing="closing"
    :labelled-by="titleId"
    :described-by="message ? messageId : undefined"
    size="sm"
    @cancel="emit('cancel')"
  >
    <div class="confirm">
      <h2
        :id="titleId"
        class="confirm__title"
      >
        {{ title }}
      </h2>
      <p
        v-if="message"
        :id="messageId"
        class="confirm__message"
      >
        {{ message }}
      </p>
      <div class="confirm__actions">
        <AppButton
          v-if="hasCancel"
          variant="secondary"
          :data-autofocus="cancelAutofocus"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </AppButton>
        <AppButton
          :variant="danger ? 'danger' : 'primary'"
          :data-autofocus="confirmAutofocus"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.confirm {
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
