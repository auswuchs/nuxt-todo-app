<script setup lang="ts">
import { ref, useId } from 'vue'

type Emits = {
  add: [text: string]
}

const emit = defineEmits<Emits>()

const inputId = useId()
const errorId = useId()
const text = ref('')
const error = ref('')

function submit() {
  const value = text.value.trim()
  if (value === '') {
    error.value = 'Введите текст пункта'
    return
  }

  emit('add', value)
  text.value = ''
  error.value = ''
}

function clearError() {
  if (error.value) error.value = ''
}
</script>

<template>
  <form
    class="todo-composer"
    @submit.prevent="submit"
  >
    <div class="todo-composer__row">
      <span
        class="todo-composer__mark"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      </span>

      <label
        class="sr-only"
        :for="inputId"
      >
        Новый пункт
      </label>
      <input
        :id="inputId"
        v-model="text"
        class="text-input todo-composer__input"
        type="text"
        maxlength="200"
        placeholder="Добавить пункт…"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        @input="clearError"
      />
      <AppButton
        type="submit"
        variant="secondary"
        size="sm"
      >
        Добавить
      </AppButton>
    </div>

    <p
      v-if="error"
      :id="errorId"
      class="form-error todo-composer__error"
      role="alert"
    >
      {{ error }}
    </p>
  </form>
</template>

<style scoped lang="scss">
.todo-composer {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid $color-border;

  &__row {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__mark {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    color: $color-muted;
  }

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__error {
    margin-top: $space-2;
    padding-left: calc(1.5rem + #{$space-2});
  }

  @include mobile {
    &__row {
      flex-wrap: wrap;
    }

    &__input {
      flex-basis: calc(100% - 1.5rem - #{$space-2});
    }

    :deep(.app-button) {
      width: 100%;
    }

    &__error {
      padding-left: 0;
    }
  }
}
</style>
