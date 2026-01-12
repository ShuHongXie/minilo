# useCountDown 倒计时钩子

用于实现倒计时功能的 Vue 钩子函数。

## 基本用法

```ts
import { useCountdown } from '@minilo/utils'

const { remaining, isRunning, formattedTime, start, stop, reset } = useCountdown(60) // 60秒倒计时

// 启动倒计时
start()

// 暂停倒计时
stop()

// 重置倒计时
reset()
```

## 参数

| 参数    | 说明             | 类型     | 默认值 | 必填 |
| ------- | ---------------- | -------- | ------ | ---- |
| seconds | 倒计时时长（秒） | `number` | -      | 是   |

## 返回值

| 属性          | 说明                 | 类型                            |
| ------------- | -------------------- | ------------------------------- |
| remaining     | 剩余秒数             | `Ref<number>`                   |
| isRunning     | 倒计时是否正在运行   | `Ref<boolean>`                  |
| formattedTime | 格式化后的时间字符串 | `ComputedRef<string>`           |
| start         | 启动倒计时的方法     | `() => void`                    |
| stop          | 暂停倒计时的方法     | `() => void`                    |
| reset         | 重置倒计时的方法     | `(newSeconds?: number) => void` |
