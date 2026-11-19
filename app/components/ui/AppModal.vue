<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type Props = {
  active?: boolean
  closing?: boolean
  labelledBy?: string
  describedBy?: string
  size?: 'sm' | 'md'
  dismissible?: boolean
  restoreFocus?: boolean
}

type Emits = {
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  closing: false,
  labelledBy: undefined,
  describedBy: undefined,
  size: 'md',
  dismissible: true,
  restoreFocus: true,
})

const emit = defineEmits<Emits>()

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const panel = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null
let hasFocused = false
let lastFocused: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  const root = panel.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled')
      && element.getAttribute('aria-hidden') !== 'true'
      && element.offsetParent !== null,
  )
}

async function focusInitial() {
  await nextTick()
  const target
    = panel.value?.querySelector<HTMLElement>('[data-autofocus]')
      ?? focusableElements()[0]
      ?? panel.value
  target?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (!props.active) return

  if (event.key === 'Escape') {
    if (!props.dismissible) return
    event.preventDefault()
    event.stopPropagation()
    emit('cancel')
    return
  }

  if (event.key !== 'Tab') return

  const items = focusableElements()
  if (items.length === 0) {
    event.preventDefault()
    panel.value?.focus()
    return
  }

  const first = items[0]!
  const last = items[items.length - 1]!
  const current = document.activeElement

  if (!panel.value?.contains(current)) {
    event.preventDefault()
    first.focus()
    return
  }

  if (event.shiftKey && current === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && current === last) {
    event.preventDefault()
    first.focus()
  }
}

function onBackdropClick() {
  if (!props.active || !props.dismissible) return
  emit('cancel')
}

watch(
  () => props.active,
  async (active) => {
    if (!active) {
      document.removeEventListener('keydown', onKeydown, true)
      const current = document.activeElement
      if (panel.value?.contains(current)) lastFocused = current as HTMLElement
      return
    }

    document.addEventListener('keydown', onKeydown, true)

    if (hasFocused) {
      const target = lastFocused && document.contains(lastFocused) ? lastFocused : null
      if (target) target.focus()
      else if (!panel.value?.contains(document.activeElement)) await focusInitial()
      return
    }

    hasFocused = true
    const current = document.activeElement as HTMLElement | null
    if (!panel.value?.contains(current)) {
      if (!opener || !document.contains(opener)) opener = current
      await focusInitial()
    }
  },
  { immediate: true },
)

watch(
  () => props.closing,
  (closing) => {
    if (!closing) return
    if (props.restoreFocus && opener && document.contains(opener)) opener.focus()
    opener = null
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)

  const current = document.activeElement
  const focusWasInside = panel.value?.contains(current) ?? false
  if (props.restoreFocus && opener && document.contains(opener) && focusWasInside) {
    opener.focus()
  }
  opener = null
})
</script>

<template>
  <Teleport to="body">
    <div
      class="app-modal"
      :class="{ 'app-modal--inactive': !active, 'app-modal--closing': closing }"
      :inert="!active"
      :aria-hidden="!active ? 'true' : undefined"
      @click.self="onBackdropClick"
    >
      <div
        ref="panel"
        class="app-modal__panel"
        :class="`app-modal__panel--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledBy"
        :aria-describedby="describedBy"
        tabindex="-1"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.app-modal {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6;
  background: $color-overlay;
  animation: modal-fade $transition-modal;

  @include mobile {
    padding: $space-4;
  }

  &--inactive {
    pointer-events: none;
  }

  &--closing {
    pointer-events: none;
    animation: modal-fade-out $transition-modal forwards;

    .app-modal__panel {
      animation: modal-fall $transition-modal forwards;
    }
  }

  &__panel {
    width: 100%;
    max-width: 32.5rem;
    max-height: calc(100vh - 3rem);
    padding: $space-6;
    overflow-y: auto;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-xl;
    box-shadow: $shadow-md;
    animation: modal-rise $transition-modal;

    &:focus {
      outline: none;
    }

    @include mobile {
      max-height: calc(100vh - 2rem);
      padding: $space-5 $space-4;
    }

    &--sm {
      max-width: 27.5rem;
    }
  }
}

@keyframes modal-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes modal-fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes modal-fall {
  from {
    opacity: 1;
    transform: none;
  }

  to {
    opacity: 0;
    transform: translateY(0.375rem) scale(0.985);
  }
}

@keyframes modal-rise {
  from {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.985);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
</style>
