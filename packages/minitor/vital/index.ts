// src/plugins/web-vitals.ts
import type { App, Plugin } from 'vue'
import type { Router, RouteLocationNormalized } from 'vue-router'
// 严格按 npm 主页导入：仅导入官方暴露的 API
// 注意：如需使用归因数据，请将导入路径改为 'web-vitals/attribution'
import { onCLS, onLCP, onINP, onFCP, onTTFB, type Metric, type ReportOpts } from 'web-vitals'

// 复用你的可靠上报方法（需确保此文件存在）
import { sendErrorData } from '../core/sender'

// ===================== 核心类型定义（严格对齐官方） =====================
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
 * 去重缓存：避免同一指标重复上报
 */
const reportedMetrics = new Set<string>()

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
    // 官方 Metric 字段
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
  // 去重：同一指标 ID 仅上报一次
  if (reportedMetrics.has(metric.id)) return
  reportedMetrics.add(metric.id)

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
 * 初始化单页面指标采集
 * @returns 销毁监听的函数（用于路由切换时清理）
 */
const initVitalsCollection = (
  pagePath: string,
  pageName: string,
  options: WebVitalsPluginOptions
): (() => void) => {
  const { metrics = ['CLS', 'LCP', 'INP', 'FCP', 'TTFB'], reportFinalOnly = true } = options

  // 官方配置项：buffered=true 捕获历史指标，once=true 仅上报最终值
  const baseOpts: ReportOpts & { buffered?: boolean; once?: boolean } = {
    buffered: true,
    once: reportFinalOnly
  }

  // 存储各指标的监听销毁函数
  const disposeFns: (() => void)[] = []

  // 1. 采集 CLS（累积布局偏移）- 严格按 npm 示例
  if (metrics.includes('CLS')) {
    const dispose = onCLS((metric) => {
      reportMetric(metric, pagePath, pageName, options)
    }, baseOpts as ReportOpts)
    disposeFns.push(() => dispose)
  }

  // 2. 采集 LCP（最大内容绘制）- 严格按 npm 示例
  if (metrics.includes('LCP')) {
    const dispose = onLCP((metric) => {
      reportMetric(metric, pagePath, pageName, options)
    }, baseOpts as ReportOpts)
    disposeFns.push(() => dispose)
  }

  // 3. 采集 INP（交互到下一次绘制）- npm 强调：需等待页面卸载才触发最终值
  if (metrics.includes('INP')) {
    const dispose = onINP(
      (metric) => {
        reportMetric(metric, pagePath, pageName, options)
      },
      {
        ...baseOpts,
        // INP 特殊配置：确保捕获所有交互后上报最终值
        reportAllChanges: !reportFinalOnly
      } as ReportOpts
    )
    disposeFns.push(() => dispose)
  }

  // 4. 采集 FCP（首次内容绘制）- 严格按 npm 示例
  if (metrics.includes('FCP')) {
    const dispose = onFCP((metric) => {
      reportMetric(metric, pagePath, pageName, options)
    }, baseOpts as ReportOpts)
    disposeFns.push(() => dispose)
  }

  // 5. 采集 TTFB（首字节时间）- 严格按 npm 示例
  if (metrics.includes('TTFB')) {
    const dispose = onTTFB((metric) => {
      reportMetric(metric, pagePath, pageName, options)
    }, baseOpts as ReportOpts)
    disposeFns.push(() => dispose)
  }

  // 返回销毁函数：路由切换时清理监听，避免内存泄漏
  return () => {
    disposeFns.forEach((dispose) => {
      try {
        dispose()
      } catch (err) {
        console.warn('Web Vitals 监听销毁失败:', err)
      }
    })
    // 清空当前页面的去重缓存
    reportedMetrics.clear()
  }
}

// ===================== Vue3 插件核心（适配生态） =====================
const WebVitalsPlugin: Plugin = {
  install(app: App, options: WebVitalsPluginOptions) {
    // 最终配置（合并默认值）
    const finalOptions = {
      reportUrl: '/api/v1/monitor/web-vitals',
      delay: 100,
      reportFinalOnly: true,
      ...options
    }

    // 存储当前页面的销毁函数（路由切换时清理）
    let currentDispose: (() => void) | null = null

    // 1. 首屏采集（页面加载完成后）
    const initFirstLoad = () => {
      if (currentDispose) currentDispose()
      currentDispose = initVitalsCollection(window.location.pathname, 'FirstLoad', finalOptions)
    }

    // 确保首屏采集时机正确（DOM 加载完成后）
    if (document.readyState === 'complete') {
      initFirstLoad()
    } else {
      window.addEventListener('load', initFirstLoad)
    }

    // 2. 路由切换采集（核心：先销毁旧监听，再初始化新监听）
    if (finalOptions.router) {
      finalOptions.router.afterEach((to: RouteLocationNormalized) => {
        // 延迟采集：等待页面渲染完成（避免采集过早）
        setTimeout(() => {
          // 清理上一页的监听（避免内存泄漏 + 重复上报）
          if (currentDispose) currentDispose()
          // 初始化当前页的采集
          currentDispose = initVitalsCollection(
            to.path,
            (to.name as string) || 'UnknownPage',
            finalOptions
          )
        }, finalOptions.delay)
      })
    }

    // 3. 页面卸载时清理监听（兜底）
    window.addEventListener('beforeunload', () => {
      if (currentDispose) currentDispose()
    })

    // 4. 挂载全局方法（支持组件内手动调用）
    app.config.globalProperties.$webVitals = {
      /**
       * 手动初始化采集
       * @param pagePath 页面路径
       * @param pageName 页面名称
       */
      init: (pagePath: string, pageName: string) => {
        if (currentDispose) currentDispose()
        currentDispose = initVitalsCollection(pagePath, pageName, finalOptions)
      },
      /**
       * 手动销毁采集
       */
      dispose: () => {
        if (currentDispose) currentDispose()
        currentDispose = null
      }
    }
  }
}

// ===================== 类型扩展（TS 类型安全） =====================
declare module 'vue' {
  interface ComponentCustomProperties {
    $webVitals: {
      init: (pagePath: string, pageName: string) => void
      dispose: () => void
    }
  }
}

export default WebVitalsPlugin
