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
        placeholder="Новый пункт"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        @input="clearError"
      />
      <AppButton type="submit">Добавить</AppButton>
    </div>
    <p
      v-if="error"
      :id="errorId"
      class="form-error"
      role="alert"
    >
      {{ error }}
    </p>
  </form>
</template>

<style scoped lang="scss">
.todo-composer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;

  &__row {
    display: flex;
    gap: 10px;

    @include mobile {
      flex-direction: column;

      :deep(.app-button) {
        width: 100%;
      }
    }
  }

  &__input {
    flex: 1;
  }
}
</style>
