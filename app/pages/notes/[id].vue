<script setup lang="ts">
import { computed } from 'vue'

import { Routes } from '~/enums/Routes'
import { useNote } from '~/modules/notes/composables/useNote'

const route = useRoute()
const noteId = computed(() => String(route.params.id ?? ''))

const {
  note,
  ready,
  notFound,
  hasChanges,
  savedFlash,
  canUndo,
  canRedo,
  titleEmpty,
  title,
  todos,
  actions,
} = useNote(noteId)

useHead(() => ({
  title: note.value?.title.trim() ? `${note.value.title} — Заметки` : 'Заметка — Заметки',
}))
</script>

<template>
  <div class="page-shell editor-page">
    <div
      v-if="!ready"
      class="editor-loading"
    >
      Загрузка заметки…
    </div>

    <section
      v-else-if="notFound"
      class="not-found"
    >
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">Заметка не найдена</h1>
      <p class="not-found__text">
        Возможно, заметка была удалена или ссылка на неё устарела.
      </p>
      <NuxtLink
        :to="Routes.Home"
        class="not-found__link"
      >
        Вернуться на главную
      </NuxtLink>
    </section>

    <template v-else-if="note">
      <div class="editor-toolbar">
        <NuxtLink
          :to="Routes.Home"
          class="editor-toolbar__back"
        >
          ← Все заметки
        </NuxtLink>

        <div
          class="editor-toolbar__status"
          role="status"
          aria-live="polite"
        >
          <span
            v-if="hasChanges"
            class="editor-toolbar__dirty"
          >
            Есть несохранённые изменения
          </span>

          <span
            v-else-if="savedFlash"
            class="editor-toolbar__saved"
          >
            Сохранено
          </span>
        </div>

        <div class="editor-toolbar__actions">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="!canUndo"
            title="Отменить (Ctrl+Z)"
            @click="actions.undo"
          >
            Отменить
          </AppButton>

          <AppButton
            variant="ghost"
            size="sm"
            :disabled="!canRedo"
            title="Повторить (Shift+Ctrl+Z)"
            @click="actions.redo"
          >
            Повторить
          </AppButton>

          <AppButton
            variant="secondary"
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

      <article class="editor">
        <label class="field editor__title-field">
          <span class="field__label">Название заметки</span>
          <input
            class="text-input editor__title-input"
            type="text"
            maxlength="120"
            placeholder="Введите название"
            :value="note.title"
            @input="title.onInput"
            @blur="title.onBlur"
          />
        </label>

        <section
          class="editor__todos"
          aria-labelledby="todos-heading"
        >
          <header class="editor__todos-header">
            <h2
              id="todos-heading"
              class="editor__todos-title"
            >
              Пункты
            </h2>
            <span class="editor__todos-count">{{ note.todos.length }}</span>
          </header>

          <ul
            v-if="note.todos.length > 0"
            class="editor__list"
          >
            <TodoItemRow
              v-for="todo in note.todos"
              :key="todo.id"
              :todo="todo"
              @toggle="todos.toggle"
              @remove="todos.remove"
              @text-input="todos.onTextInput"
              @text-blur="actions.flush"
            />
          </ul>

          <p
            v-else
            class="editor__empty"
          >
            Пока нет пунктов. Добавьте первый.
          </p>

          <TodoComposer @add="todos.add" />
        </section>
      </article>

      <footer class="editor-footer">
        <div class="editor-footer__text">
          <p class="editor-footer__title">Удаление необратимо</p>
          <p class="hint">Заметка исчезнет из списка вместе с черновиком.</p>
        </div>

        <AppButton
          variant="ghost"
          class="editor-footer__delete"
          @click="actions.deleteNote"
        >
          Удалить заметку
        </AppButton>
      </footer>
    </template>
  </div>
</template>

<style scoped lang="scss">
.editor-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.editor-loading {
  padding: 64px 0;
  text-align: center;
  color: $color-muted;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;

  &__back {
    font-size: 14px;
    font-weight: 600;
    color: $color-muted;

    &:hover {
      text-decoration: none;
      color: $color-accent;
    }
  }

  &__status {
    flex: 1;
    min-width: 120px;
    font-size: 13px;
    font-weight: 600;

    @include mobile {
      flex-basis: 100%;
      order: 3;
    }
  }

  &__dirty {
    color: #a05a17;
  }

  &__saved {
    color: $color-success;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    @include mobile {
      width: 100%;

      :deep(.app-button) {
        flex: 1;
      }
    }
  }
}

.editor {
  @include card;

  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px;

  @include mobile {
    padding: 20px 16px;
  }

  &__title-field {
    gap: 8px;
  }

  &__title-input {
    padding: 10px 12px;
    font-size: clamp(24px, 3.4vw, 34px);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    background: transparent;
    border-color: transparent;

    &:hover {
      border-color: $color-border;
    }

    &:focus {
      background: $color-surface;
      border-color: $color-accent;
    }
  }

  &__todos {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__todos-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid $color-border;
  }

  &__todos-title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: $color-text-soft;
  }

  &__todos-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 22px;
    padding: 0 7px;
    font-size: 12px;
    font-weight: 700;
    color: $color-accent;
    background: $color-accent-soft;
    border-radius: 999px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__empty {
    padding: 18px 4px;
    font-size: 14px;
    color: $color-muted;
  }
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgb(255 255 255 / 50%);
  border: 1px dashed $color-border-strong;
  border-radius: $radius-md;

  @include mobile {
    flex-direction: column;
    align-items: stretch;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__delete {
    flex: none;
    color: $color-danger;

    &:hover:not(:disabled) {
      color: $color-danger-hover;
      background: $color-danger-soft;
    }

    @include mobile {
      width: 100%;
    }
  }
}

.not-found {
  @include card;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  max-width: 560px;
  margin: 40px auto;
  padding: 40px;

  @include mobile {
    margin: 16px auto;
    padding: 28px 20px;
  }

  &__code {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: $color-accent;
  }

  &__title {
    font-size: clamp(24px, 4vw, 32px);
    letter-spacing: -0.02em;
  }

  &__text {
    color: $color-muted;
  }

  &__link {
    display: inline-flex;
    margin-top: 8px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    color: #fff;
    background: $color-accent;
    border-radius: $radius-sm;

    &:hover {
      text-decoration: none;
      background: $color-accent-hover;
    }
  }
}
</style>
