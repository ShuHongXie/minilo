import { ref, watch } from 'vue'

/**
 * 动态设置页面标题的 Hook
 * @param initialTitle 初始标题
 * @returns 标题的响应式引用
 */
export function useTitle(initialTitle: string = '') {
  const title = ref(initialTitle)

  // 监听标题变化，自动更新 document.title
  watch(
    title,
    (newTitle) => {
      if (typeof document !== 'undefined') {
        document.title = newTitle || ''
      }
    },
    { immediate: true }
  )

  return title
}
