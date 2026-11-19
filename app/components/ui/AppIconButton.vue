<script setup lang="ts">
type Props = {
  label: string
  variant?: 'ghost' | 'danger'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  disabled: false,
})
</script>

<template>
  <button
    type="button"
    class="app-icon-button"
    :class="`app-icon-button--${variant}`"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.app-icon-button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: $color-text-soft;
  border: 1px solid transparent;
  border-radius: $radius-md;
  transition:
    background-color $transition-fast,
    border-color $transition-fast,
    color $transition-fast;

  :deep(svg) {
    display: block;
    width: 1.125rem;
    height: 1.125rem;
  }

  &:hover:not(:disabled) {
    color: $color-text;
    background: $color-surface-muted;
    border-color: $color-border;
  }

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--danger:hover:not(:disabled) {
    color: $color-danger;
    background: $color-danger-soft;
    border-color: transparent;
  }

  @include mobile {
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>
