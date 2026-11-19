<script setup lang="ts">
import type { TodoItem } from '~/modules/notes/types'

type Props = {
  todo: TodoItem
}

type Emits = {
  toggle: [id: string]
  remove: [id: string]
  textInput: [payload: { id: string, value: string }]
  textBlur: []
}

defineProps<Props>()

const emit = defineEmits<Emits>()
</script>

<template>
  <li
    class="todo-row"
    :class="{ 'todo-row--done': todo.done }"
  >
    <input
      class="todo-row__checkbox"
      type="checkbox"
      :checked="todo.done"
      :aria-label="todo.done ? 'Снять отметку о выполнении' : 'Отметить выполненным'"
      @change="emit('toggle', todo.id)"
    />

    <input
      class="todo-row__text"
      type="text"
      :value="todo.text"
      aria-label="Текст пункта"
      @input="emit('textInput', {
        id: todo.id,
        value: ($event.target as HTMLInputElement).value
      })"
      @blur="emit('textBlur')"
      @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
    />

    <button
      type="button"
      class="todo-row__remove"
      aria-label="Удалить пункт"
      @click="emit('remove', todo.id)"
    >
      <svg
        viewBox="0 0 20 20"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          d="M6 6l8 8M14 6l-8 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </li>
</template>

<style scoped lang="scss">
.todo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  transition: background-color $transition-fast, border-color $transition-fast;

  @include hover {
    background: $color-surface-muted;
    border-color: $color-border;
  }

  &--done &__text {
    text-decoration: line-through;
    color: $color-muted;
  }

  &__checkbox {
    flex: none;
    width: 18px;
    height: 18px;
    accent-color: $color-accent;
    cursor: pointer;
  }

  &__text {
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;

    &:hover {
      border-color: $color-border;
    }

    &:focus {
      background: $color-surface;
      border-color: $color-accent;
      box-shadow: $shadow-focus;
      outline: none;
    }
  }

  &__remove {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    color: $color-muted;
    border-radius: 6px;
    transition: background-color $transition-fast, color $transition-fast;

    &:hover {
      color: $color-danger;
      background: $color-danger-soft;
    }
  }
}
</style>
