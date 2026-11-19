<script setup lang="ts">
import { Routes } from '~/enums/Routes'
import type { Note } from '~/modules/notes/types'

type Props = {
  note: Note
}

type Emits = {
  remove: [id: string]
}

defineProps<Props>()

const emit = defineEmits<Emits>()
</script>

<template>
  <article class="note-card">
    <div class="note-card__body">
      <h2 class="note-card__title">
        <NuxtLink
          :to="Routes.NoteDetail(note.id)"
          class="note-card__link"
        >
          {{ note.title }}
        </NuxtLink>
      </h2>

      <ul
        v-if="note.todos.length > 0"
        class="note-card__todos"
      >
        <li
          v-for="todo in note.todos.slice(0, 3)"
          :key="todo.id"
          class="note-card__todo"
        >
          <input
            class="note-card__checkbox"
            type="checkbox"
            :checked="todo.done"
            disabled
            tabindex="-1"
            aria-label="Пункт списка (только просмотр)"
          />
          <span
            class="note-card__todo-text"
            :class="{ 'is-done': todo.done }"
          >
            {{ todo.text }}
          </span>
        </li>
      </ul>
      <p
        v-else
        class="note-card__empty"
      >
        Список пунктов пока пуст
      </p>

      <p
        v-if="note.todos.length > 3"
        class="note-card__more"
      >
        и ещё {{ note.todos.length - 3 }}
      </p>
    </div>

    <footer class="note-card__footer">
      <AppButton
        variant="ghost"
        size="sm"
        @click="emit('remove', note.id)"
      >
        Удалить
      </AppButton>
      <NuxtLink
        :to="Routes.NoteDetail(note.id)"
        class="note-card__open"
      >
        Открыть
      </NuxtLink>
    </footer>
  </article>
</template>

<style scoped lang="scss">
.note-card {
  @include card;

  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  transition:
    transform $transition-card,
    box-shadow $transition-card,
    border-color $transition-card;

  @include hover {
    border-color: $color-border-strong;
    box-shadow: $shadow-lift;
    transform: translateY(-2px);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
  }

  &__title {
    font-size: 19px;
    line-height: 1.3;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  &__link {
    color: $color-text;

    &:hover {
      text-decoration: none;
      color: $color-accent;
    }
  }

  &__todos {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  &__todo {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    color: $color-text-soft;
  }

  &__checkbox {
    width: 15px;
    height: 15px;
    margin: 3px 0 0;
    accent-color: $color-accent;
    cursor: default;
    pointer-events: none;
  }

  &__todo-text {
    overflow-wrap: anywhere;

    &.is-done {
      text-decoration: line-through;
      color: $color-muted;
    }
  }

  &__empty,
  &__more {
    font-size: 13px;
    color: $color-muted;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid $color-border;
  }

  &__open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 11px;
    font-size: 13px;
    font-weight: 600;
    color: $color-text;
    background: $color-surface;
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;

    &:hover {
      text-decoration: none;
      background: $color-surface-muted;
      border-color: $color-muted;
    }
  }
}
</style>
