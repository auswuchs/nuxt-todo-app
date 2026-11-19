<script setup lang="ts">
type Props = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="app-button"
    :class="[`app-button--${variant}`, `app-button--${size}`]"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 2.5rem;
  padding: 0 $space-4;
  font-family: $font-ui;
  font-size: $text-base;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: $radius-md;
  transition:
    background-color $transition-fast,
    border-color $transition-fast,
    color $transition-fast,
    box-shadow $transition-fast,
    transform $transition-fast;

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  &--sm {
    min-height: 2.125rem;
    padding-inline: $space-3;
    font-size: $text-sm;
  }

  &--primary {
    color: $color-on-accent;
    background: $color-accent;
    box-shadow: $shadow-sm;

    &:hover:not(:disabled) {
      background: $color-accent-hover;
    }
  }

  &--secondary {
    color: $color-text;
    background: $color-surface;
    border-color: $color-border-strong;

    &:hover:not(:disabled) {
      background: $color-surface-muted;
      border-color: $color-muted;
    }
  }

  &--ghost {
    color: $color-text-soft;
    background: transparent;

    &:hover:not(:disabled) {
      color: $color-text;
      background: $color-surface-muted;
    }
  }

  &--danger {
    color: $color-on-danger;
    background: $color-danger;
    box-shadow: $shadow-sm;

    &:hover:not(:disabled) {
      background: $color-danger-hover;
    }
  }

  &--danger-ghost {
    color: $color-danger;
    background: transparent;

    &:hover:not(:disabled) {
      color: $color-danger-hover;
      background: $color-danger-soft;
    }
  }

  @include mobile {
    min-height: 2.75rem;
    padding-inline: $space-4;

    &--sm {
      min-height: 2.75rem;
    }
  }
}
</style>
