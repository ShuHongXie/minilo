# useChartResize 图表尺寸调整钩子

用于实现图表自适应尺寸调整的 Vue 钩子函数，适用于 ECharts、Chart.js 等图表库。

## 基本用法

```ts
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { useChartResize } from '@minilo/utils'

const chartContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  const { chartInstance, resizeChart, destroyChart } = useChartResize(
    chartContainer.value!,
    (container) => {
      // 初始化图表实例
      return echarts.init(container)
    }
  )
  
  // 设置图表配置
  chartInstance.value?.setOption({
    // 图表配置...
  })
})
```

## 参数

| 参数 | 说明 | 类型 | 默认值 | 必填 |
|------|------|------|--------|------|
| container | 图表容器（选择器或元素） | `string \| HTMLElement` | - | 是 |
| initChart | 图表初始化函数 | `(container: HTMLElement) => T` | - | 是 |

## 返回值

| 属性 | 说明 | 类型 |
|------|------|------|
| chartInstance | 图表实例引用 | `{ value: T \| null }` |
| resizeChart | 调整图表尺寸的方法（带防抖） | `() => void` |
| destroyChart | 销毁图表实例的方法 | `() => void` |
| refresh | 重新初始化图表的方法 | `() => void` |

## 注意事项

- 该钩子会自动监听窗口尺寸变化和容器尺寸变化
- 内部使用防抖机制优化性能
- 在组件卸载时会自动清理事件监听器和图表实例