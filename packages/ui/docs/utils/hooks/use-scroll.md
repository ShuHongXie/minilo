# useScroll 滚动钩子

用于监听滚动事件并在滚动达到特定阈值时触发回调的 Vue 钩子函数。

## 基本用法

```ts
import { ref } from 'vue'
import { useScroll } from '@minilo/utils'

const { scrollPosition, isReached, checkThreshold, updateThreshold } = useScroll({
  container: window,
  initialThreshold: 100,
  onReach: (reached) => {
    console.log('滚动阈值到达状态:', reached)
  },
  direction: 'vertical',
  throttleTime: 200
})
```

## 参数

| 参数 | 说明 | 类型 | 默认值 | 必填 |
|------|------|------|--------|------|
| container | 滚动容器 | `string \| HTMLElement \| Window` | `window` | 否 |
| initialThreshold | 初始阈值 | `number` | `0` | 否 |
| onReach | 达到阈值时的回调函数 | `Function \| null` | `null` | 否 |
| direction | 滚动方向 | `'vertical' \| 'horizontal'` | `'vertical'` | 否 |
| throttleTime | 节流时间（毫秒） | `number` | `200` | 否 |

## 返回值

| 属性 | 说明 | 类型 |
|------|------|------|
| scrollPosition | 当前滚动位置 | `Ref<number>` |
| isReached | 是否达到阈值 | `Ref<boolean>` |
| checkThreshold | 手动检查阈值的方法 | `() => void` |
| updateThreshold | 更新阈值的方法 | `(val: number) => void` |