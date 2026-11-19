<script setup lang="ts">
import { computed } from 'vue'

import { Routes } from '~/enums/Routes'
import type { Note } from '~/modules/notes/types'
import { pluralizeRu } from '~/utils/plural'

type Props = {
  note: Note
}

type Emits = {
  remove: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const todoLabel = computed(
  () => pluralizeRu(props.note.todos.length, ['пункт', 'пункта', 'пунктов']),
)
</script>

<template>
  <li class="note-entry">
    <NuxtLink
      :to="Routes.NoteDetail(note.id)"
      class="note-entry__link"
    >
      <h2 class="note-entry__title">
        {{ note.title }}
      </h2>

      <ul
        v-if="note.todos.length > 0"
        class="note-entry__todos"
      >
        <li
          v-for="todo in note.todos.slice(0, 3)"
          :key="todo.id"
          class="note-entry__todo"
        >
          <input
            class="todo-check note-entry__checkbox"
            type="checkbox"
            :checked="todo.done"
            disabled
            tabindex="-1"
            aria-label="Пункт списка (только просмотр)"
          />
          <span
            class="note-entry__todo-text"
            :class="{ 'is-done': todo.done }"
          >
            {{ todo.text }}
          </span>
        </li>
      </ul>

      <p
        v-else
        class="note-entry__empty"
      >
        Список пунктов пуст
      </p>

      <p
        v-if="note.todos.length > 3"
        class="note-entry__more"
      >
        и ещё {{ note.todos.length - 3 }}
      </p>
    </NuxtLink>

    <footer class="note-entry__footer">
      <span class="note-entry__meta">{{ todoLabel }}</span>

      <AppButton
        variant="ghost"
        size="sm"
        class="note-entry__delete"
        @click="emit('remove', note.id)"
      >
        <svg
          viewBox="0 0 20 20"
          width="15"
          height="15"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4.5 5.5h11M8 5.5V4h4v1.5M6 5.5l.6 10h6.8l.6-10M8.5 8.5v4M11.5 8.5v4" />
        </svg>
        Удалить
      </AppButton>
    </footer>
  </li>
</template>

<style scoped lang="scss">
.note-entry {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $space-5 0;
  border-bottom: 1px solid $color-border;

  &__link {
    display: block;
    color: inherit;

    &:hover {
      text-decoration: none;
    }

    &:focus-visible {
      border-radius: $radius-sm;
      outline: 2px solid $color-focus;
      outline-offset: 4px;
    }
  }

  &__title {
    font-family: $font-ui;
    font-size: $text-lg;
    font-weight: 650;
    line-height: 1.3;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
    color: $color-text;
    transition: color $transition-fast;
  }

  &__link:hover &__title {
    color: $color-accent;
  }

  &__todos {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-top: $space-3;
  }

  &__todo {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    font-size: $text-base;
    line-height: 1.4;
    color: $color-text-soft;
  }

  &__checkbox {
    width: 1.125rem;
    height: 1.125rem;
    margin-top: 0.125rem;
    pointer-events: none;
  }

  &__todo-text {
    overflow-wrap: anywhere;

    &.is-done {
      text-decoration: line-through;
      color: $color-muted;
      text-decoration-thickness: 1px;
    }
  }

  &__empty,
  &__more {
    font-size: $text-sm;
    line-height: $line-snug;
    color: $color-muted;
  }

  &__empty {
    margin-top: $space-2;
  }

  &__more {
    margin-top: $space-1;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    margin-top: auto;
    padding-top: $space-4;
  }

  &__meta {
    font-size: $text-sm;
    color: $color-muted;
    font-variant-numeric: tabular-nums;
  }

  &__delete {
    color: $color-muted;
  }

  @include mobile {
    padding: $space-4 0;
  }
}
</style>
