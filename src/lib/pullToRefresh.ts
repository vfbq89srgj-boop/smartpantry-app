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
    // The page is scrolling normally (finger went up, or page is no longer at the top):
    // stop tracking for the rest of this gesture, otherwise the indicator pushes the
    // content around while you scroll – that felt jerky.
    if (dy < 0 || window.scrollY > 0) {
      active = false
      pull.value = 0
      return
    }
    pull.value = Math.min(dy * 0.5, threshold * 1.5)
    // No preventDefault here on purpose: a non-passive touchmove listener makes iOS scrolling
    // stiff and kills the momentum ("keeps scrolling after a flick"). The browser's own
    // pull-to-reload on Android is switched off with CSS instead (see base.css).
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
