import type { App, Plugin } from 'vue'
import type { Router, RouteLocationNormalized } from 'vue-router'
import { onCLS, onLCP, onINP, onFCP, onTTFB, type Metric, type ReportOpts } from 'web-vitals'
import { sendErrorData } from '../core/sender'

/**
 * 插件配置项（扩展官方配置，适配 Vue 生态）
 */
export interface WebVitalsPluginOptions {
  /** 上报接口地址（默认：/api/v1/monitor/web-vitals） */
  reportUrl?: string
  /** 项目名称（多项目区分） */
  projectName: string
  /** 构建版本（多版本区分） */
  buildVersion: string
  /** Vue Router 实例（路由切换自动采集） */
  router?: Router
  /** 路由切换后延迟采集时间（ms，默认 100） */
  delay?: number
  /** 需要采集的指标（默认全部） */
  metrics?: ('CLS' | 'LCP' | 'INP' | 'FCP' | 'TTFB')[]
  /** 用户ID获取函数（可选） */
  getUserId?: () => string | null | undefined
  /** 自定义上报函数（覆盖默认 sendErrorData） */
  customReporter?: (data: WebVitalsReportData) => void
  /** 是否仅上报最终值（避免重复上报，默认 true） */
  reportFinalOnly?: boolean
}

/**
 * 上报数据结构（包含官方 Metric 核心字段 + 业务字段）
 */
export interface WebVitalsReportData {
  // 官方 Metric 核心字段（严格对齐）
  name: Metric['name']
  value: number
  delta: number
  id: Metric['id']
  startTime: number
  label?: string
  // 归因数据（仅在使用 attribution build 时存在）
  attribution?: any
  // 业务扩展字段
  kind: 'performance'
  type: 'web-vitals'
  pagePath: string
  pageName: string
  projectName: string
  buildVersion: string
  userId: string | null
  deviceUuid: string
  reportTime: number
}

// ===================== 工具函数（解决重复上报/设备标识） =====================
/**
 * 生成设备唯一标识（持久化到 localStorage）
 */
const getDeviceUuid = (): string => {
  const KEY = 'web_vitals_device_uuid'
  let uuid = localStorage.getItem(KEY)
  if (!uuid) {
    uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(KEY, uuid)
  }
  return uuid
}

/**
 * 当前页面上下文（用于 SPA 路由切换时更新）
 */
const currentPage = {
  path: typeof window !== 'undefined' ? window.location.pathname : '',
  name: 'FirstLoad'
}

/**
 * 去重缓存：避免同一指标重复上报
 * 使用 Map 存储 "指标名称-页面路径-指标值" 作为键，避免重复上报
 * 注意：不使用指标ID，因为 web-vitals 的 ID 在会话期间可能保持不变
 */
const reportedMetrics = new Map<string, number>()

/**
 * 重置去重缓存（路由切换时调用）
 * 清除目标页面的指标缓存，允许重新采集
 */
const resetReportedMetrics = (pagePath: string) => {
  // 清除目标页面的所有指标记录
  const keysToDelete: string[] = []
  reportedMetrics.forEach((_, key) => {
    if (key.includes(`-${pagePath}-`)) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach((key) => reportedMetrics.delete(key))
  console.log(`🧹 清除页面 ${pagePath} 的指标缓存，共 ${keysToDelete.length} 条`)
}

/**
 * 构造上报数据（严格对齐官方 Metric 结构）
 */
const buildReportData = (
  metric: Metric,
  pagePath: string,
  pageName: string,
  options: WebVitalsPluginOptions
): WebVitalsReportData => {
  return {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    startTime: (metric as any).startTime,
    label: (metric as any).label,
    // 归因数据（如果存在）
    attribution: 'attribution' in metric ? (metric as any).attribution : undefined,
    // 业务字段
    kind: 'performance',
    type: 'web-vitals',
    pagePath,
    pageName,
    projectName: options.projectName,
    buildVersion: options.buildVersion,
    userId: options.getUserId?.() || null,
    deviceUuid: getDeviceUuid(),
    reportTime: Date.now()
  }
}

/**
 * 核心上报逻辑（含去重）
 */
const reportMetric = (
  metric: Metric,
  pagePath: string,
  pageName: string,
  options: WebVitalsPluginOptions
): void => {
  // 去重：同一页面的同一指标 ID 仅上报一次
  const cachedPath = reportedMetrics.get(metric.id)
  if (cachedPath === pagePath) return
  reportedMetrics.set(metric.id, pagePath)

  // 构建数据 + 选择上报方式
  const reportData = buildReportData(metric, pagePath, pageName, options)
  const reporter =
    options.customReporter ||
    ((data) => {
      sendErrorData(data, options.reportUrl || '/api/v1/monitor/web-vitals')
    })

  // 上报（捕获错误，不影响主流程）
  try {
    reporter(reportData)
  } catch (err) {
    console.warn(`Web Vitals 上报失败 [${metric.name}]:`, err)
  }
}

// ===================== 核心采集逻辑（严格按 npm 规范实现） =====================
/**
 * 初始化单页面指标采集（支持多次调用，路由切换时重新初始化）
 */
const initVitalsCollection = (options: WebVitalsPluginOptions): void => {
  console.log('Initiating metrics collection for:', currentPage.path)
  const { metrics = ['CLS', 'LCP', 'INP', 'FCP', 'TTFB'], reportFinalOnly = true } = options

  // 官方配置项：buffered=true 捕获历史指标，reportAllChanges 控制是否上报所有变化
  const baseOpts: ReportOpts & { buffered?: boolean } = {
    buffered: true,
    reportAllChanges: !reportFinalOnly
  }

  // 1. 采集 CLS（累积布局偏移）
  if (metrics.includes('CLS')) {
    onCLS((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options)
    }, baseOpts as ReportOpts)
  }

  // 2. 采集 LCP（最大内容绘制）
  if (metrics.includes('LCP')) {
    onLCP((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options)
    }, baseOpts as ReportOpts)
  }

  // 3. 采集 INP（交互到下一次绘制）- npm 强调：需等待页面卸载才触发最终值
  if (metrics.includes('INP')) {
    onINP((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options)
    }, baseOpts as ReportOpts)
  }

  // 4. 采集 FCP（首次内容绘制）
  if (metrics.includes('FCP')) {
    onFCP((metric) => {
      console.log('FCP', metric)
      reportMetric(metric, currentPage.path, currentPage.name, options)
    }, baseOpts as ReportOpts)
  }

  // 5. 采集 TTFB（首字节时间）
  if (metrics.includes('TTFB')) {
    onTTFB((metric) => {
      reportMetric(metric, currentPage.path, currentPage.name, options)
    }, baseOpts as ReportOpts)
  }
}

// ===================== Vue3 插件核心（适配生态） =====================
export const WebVitalsPlugin: Plugin = {
  install(app: App, options: WebVitalsPluginOptions) {
    console.log('Web Vitals Plugin installed')
    // 最终配置（合并默认值）
    const finalOptions = {
      reportUrl: '/api/v1/monitor/web-vitals',
      delay: 100,
      reportFinalOnly: true,
      ...options
    }

    // 1. 首屏采集（页面加载完成后，只初始化一次）
    const initFirstLoad = () => {
      console.log('Initiating first load metrics collection')
      initVitalsCollection(finalOptions)
    }

    // 确保首屏采集时机正确（DOM 加载完成后）
    if (document.readyState === 'complete') {
      console.log('DOM is fully loaded')
      initFirstLoad()
    } else {
      console.log('DOM is not fully loaded, waiting for load event')
      window.addEventListener('load', initFirstLoad)
    }

    // 2. 路由切换采集（更新上下文 + 重置去重 + 重新初始化指标收集）
    if (finalOptions.router) {
      finalOptions.router.afterEach((to: RouteLocationNormalized) => {
        // 延迟执行，确保 DOM 更新完成
        setTimeout(() => {
          // 更新页面上下文
          currentPage.path = to.path
          currentPage.name = (to.name as string) || 'UnknownPage'

          // 重置当前页面的去重缓存
          resetReportedMetrics(currentPage.path)

          // 重新初始化指标收集（关键：重新注册监听器）
          initVitalsCollection(finalOptions)
        }, finalOptions.delay)
      })
    }

    // 3. 挂载全局方法（支持组件内手动调用）
    app.config.globalProperties.$webVitals = {
      /**
       * 手动更新采集上下文并重新初始化
       * @param pagePath 页面路径
       * @param pageName 页面名称
       */
      init: (pagePath: string, pageName: string) => {
        currentPage.path = pagePath
        currentPage.name = pageName
        resetReportedMetrics(pagePath)
        initVitalsCollection(finalOptions)
      },
      /**
       * 手动销毁采集（不支持）
       */
      dispose: () => {
        console.warn('Web Vitals 监听无法手动销毁（库限制），仅重置上下文。')
      }
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $webVitals: {
      init: (pagePath: string, pageName: string) => void
      dispose: () => void
    }
  }
}
