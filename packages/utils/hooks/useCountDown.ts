import { computed, onUnmounted, ref } from 'vue'

export function useCountdown(seconds: number) {
  // 剩余秒数
  const remaining = ref(seconds)
  // 倒计时状态
  const isRunning = ref(false)
  let timer: NodeJS.Timeout | null = null

  const formattedTime = computed(() => {
    const sec = remaining.value % 60
    const min = Math.floor(remaining.value / 60)
    // 小于1分钟显示秒数，否则显示分:秒
    return min > 0
      ? `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${sec}s`
  })

  // 启动倒计时
  const start = () => {
    if (isRunning.value || remaining.value <= 0) return
    isRunning.value = true
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) {
        stop()
      }
    }, 1000)
  }

  // 暂停倒计时
  const stop = () => {
    clearInterval(timer as NodeJS.Timeout)
    timer = null
    isRunning.value = false
  }

  // 重置倒计时
  const reset = (newSeconds = seconds) => {
    stop()
    remaining.value = newSeconds
  }

  onUnmounted(() => stop())

  return { remaining, isRunning, formattedTime, start, stop, reset }
}
