<script setup lang="ts">
import { useNotes } from '~/modules/notes/composables/useNotes'

useHead({ title: 'Заметки' })

const { notes, isEmpty, countLabel, createNote, deleteNote } = useNotes()
</script>

<template>
  <div class="page-shell catalog">
    <header class="catalog__header">
      <div class="catalog__heading">
        <h1 class="page-title">
          Заметки
        </h1>
        <p class="page-subtitle">
          {{ isEmpty ? 'Личное пространство' : countLabel }}
        </p>
      </div>

      <AppButton
        class="catalog__create"
        @click="createNote"
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
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
        Новая заметка
      </AppButton>
    </header>

    <ul
      v-if="!isEmpty"
      class="catalog__list"
      aria-label="Список заметок"
    >
      <NoteEntry
        v-for="note in notes"
        :key="note.id"
        :note="note"
        @remove="deleteNote(note)"
      />
    </ul>

    <section
      v-else
      class="catalog__empty"
    >
      <h2 class="catalog__empty-title">
        Пока нет заметок
      </h2>
      <p class="catalog__empty-text">
        Создайте первую — она появится здесь вместе со списком пунктов.
      </p>
      <AppButton @click="createNote">
        Создать первую заметку
      </AppButton>
    </section>
  </div>
</template>

<style scoped lang="scss">
.catalog {
  &__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $space-6;
    padding-bottom: $space-5;

    @include mobile {
      flex-direction: column;
      align-items: stretch;
      gap: $space-5;
    }
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  &__create {
    flex: none;

    @include mobile {
      width: 100%;
    }
  }

  &__list {
    display: grid;
    row-gap: 0;
    column-gap: $space-8;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    border-top: 1px solid $color-border;

    @include mobile {
      column-gap: 0;
      grid-template-columns: 1fr;
    }
  }

  &__empty {
    max-width: 30rem;
    padding-top: $space-10;
    border-top: 1px solid $color-border;

    @include mobile {
      padding-top: $space-8;
    }
  }

  &__empty-title {
    font-size: $text-xl;
    line-height: $line-tight;
  }

  &__empty-text {
    margin-top: $space-2;
    font-size: $text-base;
    line-height: $line-snug;
    color: $color-muted;
  }

  &__empty :deep(.app-button) {
    margin-top: $space-5;
  }
}
</style>
