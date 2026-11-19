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
  z-index: 10;
  background: rgb(243 241 236 / 86%);
  border-bottom: 1px solid rgb(226 221 212 / 80%);
  backdrop-filter: blur(10px);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    max-width: 1040px;
    margin: 0 auto;
    padding: 14px 24px;

    @include mobile {
      padding: 12px 16px;
    }
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: $color-text;

    &:hover {
      text-decoration: none;
      color: $color-text;
    }
  }

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #fff;
    background: $color-accent;
    border-radius: 9px;
    box-shadow: $shadow-accent;
  }

  &__name {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  &__hint {
    font-size: 13px;
    color: $color-muted;

    @include mobile {
      display: none;
    }
  }
}

.app-main {
  flex: 1;
}
</style>
