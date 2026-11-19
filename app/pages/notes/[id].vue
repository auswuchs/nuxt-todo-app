<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { navigateTo } from '#imports'
import { Routes } from '~/enums/Routes'
import { useNote } from '~/modules/notes/composables/useNote'

const route = useRoute()
const noteId = computed(() => String(route.params.id ?? ''))
const titleEl = ref<HTMLTextAreaElement | null>(null)

const {
  note,
  ready,
  notFound,
  hasChanges,
  savedFlash,
  canUndo,
  canRedo,
  titleEmpty,
  remoteChanged,
  title,
  todos,
  actions,
} = useNote(noteId)

useHead(() => ({
  title: note.value?.title.trim() ? `${note.value.title} — Заметки` : 'Заметка — Заметки',
}))

function resizeTitle() {
  const element = titleEl.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

function goHome() {
  return navigateTo(Routes.Home)
}

watch(
  () => note.value?.title,
  () => nextTick(resizeTitle),
)

onMounted(() => {
  resizeTitle()
  window.addEventListener('resize', resizeTitle)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeTitle)
})
</script>

<template>
  <div class="page-shell editor-page">
    <div
      v-if="!ready"
      class="editor-skeleton"
      role="status"
      aria-live="polite"
    >
      <span class="sr-only">Загрузка заметки…</span>

      <div
        class="editor-skeleton__toolbar"
        aria-hidden="true"
      >
        <span class="skeleton editor-skeleton__back" />
        <span class="skeleton editor-skeleton__actions" />
      </div>

      <div
        class="editor-skeleton__sheet"
        aria-hidden="true"
      >
        <span class="skeleton editor-skeleton__title" />
        <span class="skeleton editor-skeleton__line" />
        <span class="skeleton editor-skeleton__line editor-skeleton__line--short" />
        <span class="skeleton editor-skeleton__line" />
      </div>
    </div>

    <section
      v-else-if="notFound"
      class="not-found"
    >
      <h1 class="not-found__title">
        Заметка не найдена
      </h1>
      <p class="not-found__text">
        Возможно, её удалили или ссылка устарела.
      </p>
      <AppButton @click="goHome">
        Вернуться к заметкам
      </AppButton>
    </section>

    <template v-else-if="note">
      <div class="editor-toolbar">
        <NuxtLink
          :to="Routes.Home"
          class="editor-toolbar__back"
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M13 8H3M7 4 3 8l4 4" />
          </svg>
          Все заметки
        </NuxtLink>

        <div
          class="editor-toolbar__status"
          role="status"
          aria-live="polite"
        >
          <span
            v-if="hasChanges"
            class="status status--dirty"
          >
            <span class="status__dot" />
            Не сохранено
          </span>
          <span
            v-else-if="savedFlash"
            class="status status--saved"
          >
            <span class="status__dot" />
            Сохранено
          </span>
        </div>

        <div class="editor-toolbar__actions">
          <AppIconButton
            label="Отменить (Ctrl+Z)"
            :disabled="!canUndo"
            @click="actions.undo"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 8h7a4 4 0 0 1 0 8H8" />
              <path d="m7 5-3 3 3 3" />
            </svg>
          </AppIconButton>

          <AppIconButton
            label="Повторить (Shift+Ctrl+Z)"
            :disabled="!canRedo"
            @click="actions.redo"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 8H9a4 4 0 0 0 0 8h3" />
              <path d="m13 5 3 3-3 3" />
            </svg>
          </AppIconButton>

          <span
            class="editor-toolbar__divider"
            aria-hidden="true"
          />

          <AppButton
            variant="ghost"
            size="sm"
            @click="actions.cancel"
          >
            Отмена
          </AppButton>

          <AppButton
            variant="primary"
            size="sm"
            :disabled="titleEmpty"
            @click="actions.save"
          >
            Сохранить
          </AppButton>
        </div>
      </div>

      <div
        v-if="remoteChanged"
        class="editor-remote"
        role="status"
      >
        <span class="editor-remote__text">
          Заметка изменена в другой вкладке. Загрузить новую версию? Несохранённые правки будут потеряны.
        </span>
        <AppButton
          variant="secondary"
          size="sm"
          @click="actions.loadRemoteVersion"
        >
          Загрузить версию
        </AppButton>
      </div>

      <article class="editor-sheet">
        <label
          class="sr-only"
          for="note-title"
        >
          Название заметки
        </label>
        <textarea
          id="note-title"
          ref="titleEl"
          class="editor-title"
          rows="1"
          maxlength="120"
          autocomplete="off"
          placeholder="Без названия"
          :value="note.title"
          @input="title.onInput"
          @blur="title.onBlur"
          @keydown.enter.prevent="($event.target as HTMLTextAreaElement).blur()"
        />

        <section
          class="todos"
          aria-labelledby="todos-heading"
        >
          <header class="todos__header">
            <h2
              id="todos-heading"
              class="todos__title"
            >
              Пункты
            </h2>
            <span class="todos__count">{{ note.todos.length }}</span>
          </header>

          <ul
            v-if="note.todos.length > 0"
            class="todos__list"
          >
            <TodoItemRow
              v-for="todo in note.todos"
              :key="todo.id"
              :todo="todo"
              @toggle="todos.toggle"
              @remove="todos.remove"
              @text-input="todos.onTextInput"
              @text-blur="actions.flushPending"
            />
          </ul>

          <p
            v-else
            class="todos__empty"
          >
            Пока нет пунктов.
          </p>

          <TodoComposer @add="todos.add" />
        </section>

        <footer class="editor-sheet__footer">
          <AppButton
            variant="danger-ghost"
            size="sm"
            @click="actions.deleteNote"
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4.5 5.5h11M8 5.5V4h4v1.5M6 5.5l.6 10h6.8l.6-10M8.5 8.5v4M11.5 8.5v4" />
            </svg>
            Удалить заметку
          </AppButton>
        </footer>
      </article>
    </template>
  </div>
</template>

<style scoped lang="scss">
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-5;

  &__back {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: $space-2;
    min-height: 2.5rem;
    padding: 0 $space-2;
    font-size: $text-sm;
    font-weight: 650;
    color: $color-muted;
    border-radius: $radius-sm;
    transition: color $transition-fast, background-color $transition-fast;

    &:hover {
      text-decoration: none;
      color: $color-accent;
      background: $color-surface-muted;
    }

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__status {
    display: flex;
    flex: 1;
    align-items: center;
    min-height: 1.25rem;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2;
    margin-left: auto;
  }

  &__divider {
    width: 1px;
    height: 1.25rem;
    margin-inline: $space-1;
    background: $color-border;
  }

  @include mobile {
    &__back {
      min-height: 2.75rem;
    }

    &__status {
      flex-basis: 100%;
      order: 3;
    }

    &__actions {
      justify-content: flex-end;
      width: 100%;
      margin-left: 0;
    }
  }
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: $text-sm;
  font-weight: 600;
  color: $color-muted;

  &__dot {
    width: 0.375rem;
    height: 0.375rem;
    background: currentcolor;
    border-radius: 50%;
  }

  &--dirty {
    color: $color-text-soft;

    .status__dot {
      background: $color-accent;
    }
  }

  &--saved {
    color: $color-success;
  }
}

.editor-remote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  font-size: $text-base;
  line-height: $line-snug;
  color: $color-text-soft;
  background: $color-accent-soft;
  border-radius: $radius-md;

  @include mobile {
    flex-direction: column;
    align-items: stretch;

    :deep(.app-button) {
      width: 100%;
    }
  }
}

.editor-sheet {
  padding: $space-8 $space-10;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: $shadow-lift;

  @include mobile {
    padding: $space-6 $space-4;
    border-radius: $radius-lg;
  }
}

.editor-title {
  display: block;
  width: 100%;
  min-height: 3.5rem;
  padding: 0 0 $space-3;
  overflow: hidden;
  font-family: $font-ui;
  font-size: $text-3xl;
  font-weight: 650;
  line-height: $line-tight;
  letter-spacing: -0.03em;
  color: $color-text;
  background: transparent;
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid $color-border;
  transition: border-color $transition-fast, box-shadow $transition-fast;
  resize: none;

  &::placeholder {
    color: $color-muted;
  }

  &:hover {
    border-color: $color-border-strong;
  }

  &:focus {
    border-color: $color-accent;
    box-shadow: 0 2px 0 $color-accent;
    outline: none;
  }

  @include mobile {
    min-height: 2.75rem;
    font-size: 1.875rem;
  }
}

.todos {
  margin-top: $space-8;

  @include mobile {
    margin-top: $space-6;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding-bottom: $space-3;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    font-family: $font-ui;
    font-size: $text-sm;
    font-weight: 650;
    letter-spacing: 0.01em;
    color: $color-text-soft;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.375rem;
    padding: 0 0.5rem;
    font-size: $text-xs;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
    color: $color-accent;
    background: $color-accent-soft;
    border-radius: 999px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin-top: $space-2;
  }

  &__empty {
    padding: $space-4 0;
    font-size: $text-base;
    color: $color-muted;
  }
}

.editor-sheet__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: $space-6;
  padding-top: $space-4;
  border-top: 1px solid $color-border;
}

.not-found {
  max-width: 30rem;
  padding-top: $space-14;

  @include mobile {
    padding-top: $space-10;
  }

  &__title {
    font-size: $text-2xl;
    line-height: $line-tight;
  }

  &__text {
    margin-top: $space-2;
    font-size: $text-base;
    line-height: $line-snug;
    color: $color-muted;
  }

  :deep(.app-button) {
    margin-top: $space-5;
  }
}

.editor-skeleton {
  max-width: 100%;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-5;
  }

  &__back {
    width: 6rem;
    height: 1.25rem;
  }

  &__actions {
    width: 12rem;
    height: 2.5rem;
  }

  &__sheet {
    padding: $space-8 $space-10;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-lift;

    @include mobile {
      padding: $space-6 $space-4;
      border-radius: $radius-lg;
    }
  }

  &__title {
    width: 62%;
    height: 2.75rem;
    margin-bottom: $space-8;
  }

  &__line {
    width: 100%;
    height: 0.875rem;
    margin-bottom: $space-3;

    &--short {
      width: 54%;
    }
  }
}

.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    $color-surface-muted 25%,
    $color-surface 50%,
    $color-surface-muted 75%
  );
  background-size: 200% 100%;
  border-radius: $radius-sm;
  animation: skeleton-shimmer 1.4s $ease-out infinite;

  @media (prefers-reduced-motion: reduce) {
    background: $color-surface-muted;
    animation: none;
  }
}

@keyframes skeleton-shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
