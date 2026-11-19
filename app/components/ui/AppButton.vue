<script setup lang="ts">
type Props = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
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
  gap: 6px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  transition:
    background-color $transition-fast,
    border-color $transition-fast,
    color $transition-fast,
    box-shadow $transition-fast;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &--sm {
    padding: 7px 11px;
    font-size: 13px;
  }

  &--md {
    padding: 10px 16px;
    font-size: 14px;
  }

  &--primary {
    color: #fff;
    background: $color-accent;

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
      background: rgb(30 28 25 / 6%);
    }
  }

  &--danger {
    color: #fff;
    background: $color-danger;

    &:hover:not(:disabled) {
      background: $color-danger-hover;
    }
  }
}
</style>
