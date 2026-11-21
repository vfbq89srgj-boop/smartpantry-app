/*
  Pull-to-refresh: drag down at the top of the page, release → onRefresh() runs.
  Returns `pull` (current drag distance in px) and `refreshing` for the indicator.
*/
import { onMounted, onUnmounted, ref } from 'vue'

export function usePullToRefresh(onRefresh: () => Promise<unknown>, threshold = 70) {
  const pull = ref(0)
  const refreshing = ref(false)
  let startY = 0
  let active = false

  function start(e: TouchEvent) {
    if (window.scrollY > 0 || refreshing.value) return // only at the top of the page
    startY = e.touches[0].clientY
    active = true
  }

  function move(e: TouchEvent) {
    if (!active) return
    const dy = e.touches[0].clientY - startY
    pull.value = dy > 0 ? Math.min(dy * 0.5, threshold * 1.5) : 0
  }

  async function end() {
    if (!active) return
    active = false
    if (pull.value >= threshold) {
      refreshing.value = true
      pull.value = threshold
      try {
        await onRefresh()
      } finally {
        refreshing.value = false
      }
    }
    pull.value = 0
  }

  onMounted(() => {
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', end)
  })
  onUnmounted(() => {
    window.removeEventListener('touchstart', start)
    window.removeEventListener('touchmove', move)
    window.removeEventListener('touchend', end)
    window.removeEventListener('touchcancel', end)
  })

  return { pull, refreshing }
}
