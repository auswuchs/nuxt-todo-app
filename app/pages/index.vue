<script setup lang="ts">
import { useNotes } from '~/modules/notes/composables/useNotes'

useHead({ title: 'Заметки' })

const { notes, isEmpty, createNote, deleteNote } = useNotes()
</script>

<template>
  <div class="page-shell catalog">
    <section class="catalog__hero">
      <div class="catalog__heading">
        <p class="catalog__eyebrow">Личное пространство</p>
        <h1 class="page-title">Заметки</h1>
        <p class="page-subtitle">
          {{ isEmpty ? 'Пока пусто. Создайте первую заметку.' : `Всего заметок: ${notes.length}` }}
        </p>
      </div>
      <AppButton
        class="catalog__create"
        @click="createNote"
      >
        Создать заметку
      </AppButton>
    </section>

    <section
      v-if="!isEmpty"
      class="catalog__grid"
      aria-label="Список заметок"
    >
      <NoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        @remove="deleteNote(note)"
      />
    </section>

    <section
      v-else
      class="catalog__empty"
    >
      <div
        class="catalog__empty-icon"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          width="48"
          height="48"
        >
          <rect
            x="8"
            y="6"
            width="32"
            height="36"
            rx="5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M16 17h16M16 24h16M16 31h10"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <h2>Здесь появятся ваши заметки</h2>
      <p>Каждая заметка — это название и список пунктов, которые можно отмечать выполненными.</p>
      <AppButton @click="createNote">Создать первую заметку</AppButton>
    </section>
  </div>
</template>

<style scoped lang="scss">
.catalog {
  display: flex;
  flex-direction: column;
  gap: 28px;

  &__hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;

    @include mobile {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: $color-accent;
  }

  &__create {
    flex: none;

    @include mobile {
      width: 100%;
    }
  }

  &__grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

    @include mobile {
      grid-template-columns: 1fr;
    }
  }

  &__empty {
    @include card;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 52px 28px;
    text-align: center;

    h2 {
      font-size: 21px;
      letter-spacing: -0.01em;
    }

    p {
      max-width: 440px;
      font-size: 15px;
      color: $color-muted;
    }
  }

  &__empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    color: $color-accent;
    background: $color-accent-soft;
    border-radius: 50%;
  }
}
</style>
