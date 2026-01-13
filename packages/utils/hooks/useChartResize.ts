import { onMounted, onUnmounted, ref } from 'vue'
import type { ChartInstance } from '@minilo/types'

export interface UseChartResizeReturn<T extends ChartInstance = ChartInstance> {
  chartInstance: { value: T | null }
  resizeChart: () => void
  destroyChart: () => void
  refresh: () => void
}

/**
 * @description 图表自适应尺寸 Hooks（适配 ECharts/Chart.js 等）
 * @author xieshuhong
 * @export
 * @template T
 * @param {(string | HTMLElement)} container 图表容器（选择器/元素）
 * @param {(container: HTMLElement) => T} initChart 图表初始化函数
 * @return {*}  {UseChartResizeReturn<T>} 图表实例和刷新方法
 */
export function useChartResize<T extends ChartInstance = ChartInstance>(
  container: string | HTMLElement,
  initChart: (container: HTMLElement) => T
): UseChartResizeReturn<T> {
  const chartInstance = ref<T | null>(null)
  let resizeTimer: NodeJS.Timeout | null = null

  // 获取容器元素
  const getContainer = (): HTMLElement | null => {
    return typeof container === 'string'
      ? (document.querySelector(container) as HTMLElement)
      : (container as HTMLElement)
  }

  // 初始化图表
  const init = () => {
    const el = getContainer()
    if (!el) return
    chartInstance.value = initChart(el)
  }

  // 重绘图表（防抖）
  const resizeChart = () => {
    clearTimeout(resizeTimer as NodeJS.Timeout)
    resizeTimer = setTimeout(() => {
      if (chartInstance.value) {
        chartInstance.value.resize()
      }
    }, 300)
  }

  // 销毁图表
  const destroyChart = () => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
    clearTimeout(resizeTimer as NodeJS.Timeout)
  }

  // 监听容器尺寸变化
  onMounted(() => {
    init()
    window.addEventListener('resize', resizeChart)
    const el = getContainer()
    if (el) new ResizeObserver(resizeChart).observe(el)
  })

  // 组件卸载/销毁
  onUnmounted(() => {
    destroyChart()
    window.removeEventListener('resize', resizeChart)
    const el = getContainer()
    if (el) new ResizeObserver(resizeChart).unobserve(el)
  })

  return {
    chartInstance: chartInstance as { value: T | null },
    resizeChart,
    destroyChart,
    refresh: init
  }
}
