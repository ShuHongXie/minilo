import { getBrowserInfo, generateErrorKey } from './utils'

interface ThrottleConfig {
  windowTime: number // 节流时间窗口（毫秒）
  maxCount: number // 窗口内最大上报数
  criticalErrors: string[] // 关键错误关键词（不受节流/采样限制）
}

interface BatchConfig {
  maxSize: number // 队列满N条则上报
  timeout: number // 超时时间（毫秒），到点无论队列大小都上报
}

interface ErrorCacheItem {
  timestamp: number
}

// 全局配置
const CONFIG = {
  // 错误去重缓存过期时间（30秒）
  cacheExpire: 30 * 1000,
  // 节流配置
  throttle: {
    windowTime: 5 * 1000, // 5秒窗口
    maxCount: 10, // 最多上报10条
    criticalErrors: ['Uncaught TypeError', 'RangeError', 'Network Error']
  } as ThrottleConfig,
  // 采样率（0-1，1=100%上报，高流量时可动态调整）
  sampleRate: 0.4, // 10%采样
  // 批量上报配置
  batch: {
    maxSize: 10, // 队列满10条上报
    timeout: 5 * 1000 // 5秒超时上报
  } as BatchConfig
}

// 错误去重缓存：key=错误唯一标识，value=上报时间戳
const errorCache = new Map<string, ErrorCacheItem>()
// 节流计数与定时器
let throttleCount = 0
let throttleTimer: NodeJS.Timeout | null = null
// 批量上报队列（存储通过所有校验的错误数据）
const errorBatchQueue: Record<string, any>[] = []
// 批量上报定时器
let batchTimer: NodeJS.Timeout | null = null

// ===================== 内存泄漏防护 =====================
// 页面卸载前清理定时器，防止内存泄漏
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupTimers)
}

/**
 * 清理所有定时器，防止内存泄漏
 */
function cleanupTimers(): void {
  if (throttleTimer) {
    clearTimeout(throttleTimer)
    throttleTimer = null
  }
  if (batchTimer) {
    clearTimeout(batchTimer)
    batchTimer = null
  }
  // 清空队列
  errorBatchQueue.length = 0
  // 清空缓存
  errorCache.clear()
}

/**
 * 清理过期的错误缓存（避免内存泄漏）
 */
function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, item] of errorCache.entries()) {
    if (now - item.timestamp > CONFIG.cacheExpire) {
      errorCache.delete(key)
    }
  }
}

/**
 * 手动更新去重缓存（仅在采样命中时调用）
 *
 */
function updateErrorCache(errorData: Record<string, any>): void {
  const key = generateErrorKey(errorData)
  errorCache.set(key, { timestamp: Date.now() })
}

/**
 * 过滤无效错误（跨域、第三方、已知无害错误）
 * @param errorData 错误数据
 * @returns true=有效（保留），false=无效（过滤）
 */
function filterInvalidError(errorData: Record<string, any>): boolean {
  const message = errorData.message || ''
  // 1. 过滤跨域Script error
  if (message.includes('Script error.')) return false
  // 2. 过滤第三方库错误（如百度统计、广告脚本）
  if (
    errorData.fileName &&
    (errorData.fileName.includes('baidu.com') ||
      errorData.fileName.includes('google-analytics.com'))
  ) {
    return false
  }
  // 3. 过滤已知无害错误
  const harmlessErrors = [
    'ResizeObserver loop limit exceeded',
    'requestIdleCallback is not defined'
  ]
  if (harmlessErrors.some((keyword) => message.includes(keyword))) return false
  // 4. 其他有效错误保留
  return true
}

/**
 * 检查错误是否重复（去重逻辑）
 * @param errorData 错误数据
 * @returns true=重复（拦截），false=不重复（保留）
 */
function isDuplicateError(errorData: Record<string, any>): boolean {
  const key = generateErrorKey(errorData)
  const cacheItem = errorCache.get(key)

  cleanExpiredCache() // 每次检查都清理过期缓存，避免内存泄漏
  return !!(cacheItem && Date.now() - cacheItem.timestamp < CONFIG.cacheExpire)
}

/**
 * 节流控制：限制单位时间内的上报次数
 * @param errorData 错误数据
 * @returns true=允许上报，false=拦截
 */
function checkThrottle(errorData: Record<string, any>): boolean {
  const message = errorData.message || ''
  // 关键错误直接放行（不受节流限制）
  const isCritical = CONFIG.throttle.criticalErrors.some((keyword) => message.includes(keyword))
  if (isCritical) return true

  // 初始化/重置节流定时器
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      throttleCount = 0
      throttleTimer = null
    }, CONFIG.throttle.windowTime)
  }

  // 超出阈值则拦截
  if (throttleCount >= CONFIG.throttle.maxCount) {
    console.warn(
      `[错误上报节流] 5秒内已上报${CONFIG.throttle.maxCount}条，本次拦截`,
      errorData.message
    )
    return false
  }

  // 未超出则计数+1
  throttleCount++
  return true
}

/**
 * 采样控制：按比例上报（高流量场景降低压力）
 * @param errorData 错误数据
 * @returns true=上报，false=拦截
 */
function checkSample(errorData: Record<string, any>): boolean {
  const message = errorData.message || ''
  // 关键错误不受采样限制
  const isCritical = CONFIG.throttle.criticalErrors.some((keyword) => message.includes(keyword))
  if (isCritical) return true
  const ramdomRate = Math.random()
  // console.log('[采样] 检查采样率', ramdomRate, CONFIG.sampleRate)
  return ramdomRate <= CONFIG.sampleRate
}

/**
 * 批量上报核心方法（原sendErrorData改造为批量发送）
 * @param errors 批量错误数据
 * @param url 上报接口地址
 */
function sendBatchErrorData(errors: Record<string, any>[], url: string): void {
  if (errors.length === 0) return

  console.log('[批量上报] 发送错误数据', errors)
  // 合并浏览器信息到批量数据中（统一处理，避免重复计算）
  const browserInfo = getBrowserInfo()
  const dataToSend = errors.map((error) => {
    return {
      ...error,
      ...browserInfo
    }
  })

  // 保留原sendBeacon + fetch降级逻辑
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(dataToSend)], { type: 'application/json' }) // 修复：使用dataToSend而非errors
    navigator.sendBeacon(url, blob)
  } else {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
      keepalive: true // 页面关闭仍能发送
    }).catch((error) => console.error('批量上报失败:', error))
  }
}

/**
 * 触发批量上报（清空队列并发送）
 */
function triggerBatchReport(url: string): void {
  if (errorBatchQueue.length === 0) return
  const errorsToSend = [...errorBatchQueue]
  errorBatchQueue.length = 0
  if (batchTimer) {
    clearTimeout(batchTimer)
    batchTimer = null
  }

  sendBatchErrorData(errorsToSend, url)
}

/**
 * 添加错误到批量队列（核心入口）
 * @param errorData 单条错误数据
 * @param url 上报接口地址
 */
function addToBatchQueue(errorData: Record<string, any>, url: string): void {
  errorBatchQueue.push(errorData)

  // 2. 启动批量定时器（避免重复）
  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      triggerBatchReport(url)
    }, CONFIG.batch.timeout)
  }

  // 3. 队列满则立即上报
  if (errorBatchQueue.length >= CONFIG.batch.maxSize) {
    triggerBatchReport(url)
  }
}

/**
 * 错误上报统一入口（整合所有截流逻辑）
 * @param errorData 错误数据
 * @param url 上报接口地址
 */
export const sendErrorData = (errorData: Record<string, any>, url: string): void => {
  try {
    console.log('原始错误数据', errorData)

    // 步骤1：过滤无效错误
    if (!filterInvalidError(errorData)) {
      console.log('[过滤] 无效错误，拦截上报', errorData.message)
      return
    }

    // 步骤2：检查是否重复
    if (isDuplicateError(errorData)) {
      console.log('[去重] 重复错误，拦截上报', errorData.message)
      return
    }

    // 步骤3：检查节流限制
    if (!checkThrottle(errorData)) {
      return // 节流拦截，无需日志（节流内部已打印）
    }

    // 步骤4：检查采样率
    if (!checkSample(errorData)) {
      console.log('[采样] 未命中采样，拦截上报', errorData.message)
      return
    }

    updateErrorCache(errorData)

    // 步骤5：通过所有校验，加入批量队列
    addToBatchQueue(errorData, url)
  } catch (error) {
    console.error('错误上报逻辑自身异常:', error)
  }
}
