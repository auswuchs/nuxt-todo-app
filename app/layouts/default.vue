<script setup lang="ts">
import { Routes } from '~/enums/Routes'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <NuxtLink
          :to="Routes.Home"
          class="app-header__brand"
        >
          <span
            class="app-header__mark"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                d="M6 4.5h12A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path
                d="M8.5 9h7M8.5 12.5h7M8.5 16h4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <span class="app-header__name">Заметки</span>
        </NuxtLink>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: $z-header;
  background: $color-surface;
  border-bottom: 1px solid $color-border;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;
    width: 100%;
    max-width: $page-max;
    height: $header-height;
    margin: 0 auto;
    padding: 0 $space-6;

    @include mobile {
      padding: 0 $space-4;
    }
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    min-height: 2.75rem;
    color: $color-text;

    &:hover {
      text-decoration: none;
      color: $color-text;
    }

    &:focus-visible {
      @include focus-ring;

      border-radius: $radius-sm;
    }
  }

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    color: $color-on-accent;
    background: $color-accent;
    border-radius: 0.625rem;
    box-shadow: $shadow-accent;

    :deep(svg) {
      width: 1.125rem;
      height: 1.125rem;
    }
  }

  &__name {
    font-family: $font-ui;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}

.app-main {
  flex: 1;
}
</style>
