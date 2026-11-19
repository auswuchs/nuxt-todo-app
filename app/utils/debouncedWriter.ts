export interface DebouncedWriter {
  schedule(): void
  flush(): void
  cancel(): void
}

export function createDebouncedWriter(write: () => void, delayMs: number): DebouncedWriter {
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function flush() {
    if (timer === null) return
    cancel()
    write()
  }

  function schedule() {
    cancel()
    timer = setTimeout(() => {
      timer = null
      write()
    }, delayMs)
  }

  return {
    schedule,
    flush,
    cancel,
  }
}
