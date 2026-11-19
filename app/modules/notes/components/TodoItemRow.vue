<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const textEl = ref<HTMLTextAreaElement | null>(null)

function resizeText() {
  const element = textEl.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

watch(
  () => props.todo.text,
  () => nextTick(resizeText),
)

onMounted(() => {
  resizeText()
  window.addEventListener('resize', resizeText)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeText)
})
</script>

<template>
  <li
    class="todo-row"
    :class="{ 'todo-row--done': todo.done }"
  >
    <input
      class="todo-check todo-row__checkbox"
      type="checkbox"
      :checked="todo.done"
      :aria-label="todo.done ? 'Снять отметку о выполнении' : 'Отметить выполненным'"
      @change="emit('toggle', todo.id)"
    />

    <textarea
      ref="textEl"
      class="todo-row__text"
      rows="1"
      :value="todo.text"
      aria-label="Текст пункта"
      @input="emit('textInput', {
        id: todo.id,
        value: ($event.target as HTMLTextAreaElement).value
      })"
      @blur="emit('textBlur')"
      @keydown.enter.prevent="($event.target as HTMLTextAreaElement).blur()"
    />

    <AppIconButton
      class="todo-row__remove"
      label="Удалить пункт"
      variant="danger"
      @click="emit('remove', todo.id)"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      >
        <path d="M6 6l8 8M14 6l-8 8" />
      </svg>
    </AppIconButton>
  </li>
</template>

<style scoped lang="scss">
.todo-row {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  margin-inline: -$space-2;
  padding: $space-2;
  border-radius: $radius-md;
  transition: background-color $transition-fast;

  &:hover,
  &:focus-within {
    background: $color-surface-muted;
  }

  &__checkbox {
    flex: none;
    margin-top: 0.4rem;
  }

  &__text {
    display: block;
    flex: 1;
    min-width: 0;
    min-height: 2.25rem;
    padding: 0.375rem 0.5rem;
    overflow: hidden;
    line-height: 1.45;
    color: $color-text;
    background: transparent;
    border: 1px solid transparent;
    border-radius: $radius-sm;
    transition:
      background-color $transition-fast,
      border-color $transition-fast,
      box-shadow $transition-fast;
    resize: none;

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

  &--done &__text {
    text-decoration: line-through;
    color: $color-muted;
    text-decoration-thickness: 1px;
  }

  &__remove {
    margin-top: 0.0625rem;
    opacity: 0.55;
    transition: opacity $transition-fast;
  }

  &:hover &__remove,
  &:focus-within &__remove {
    opacity: 1;
  }

  @include mobile {
    margin-inline: 0;
    padding-inline: 0;

    &__remove {
      opacity: 1;
    }
  }
}
</style>
