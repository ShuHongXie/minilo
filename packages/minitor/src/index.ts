import { monitorJavaScriptErrors } from './errorHandler'
import { monitorNetworkErrors } from './networkMonitor'
import { monitorResourceErrors } from './resourceMonitor'
import { sendErrorData } from './sender'
import { formatErrorMessage } from './utils'

interface ErrorMonitorConfig {
  reportUrl: string // 上报错误的服务端地址
  projectName: string // 项目名称
  environment: string // 当前环境，如 "production", "development"
}

let __monitorInitialized = false

/**
 * 初始化错误监控 SDK
 * 该函数是 SDK 的入口，负责启动各类错误监控模块
 *
 * @param {ErrorMonitorConfig} config - 监控配置对象
 */
export const initErrorMonitor = (config: ErrorMonitorConfig) => {
  const { reportUrl, projectName, environment } = config

  // 初始化各类错误监控
  monitorJavaScriptErrors(reportUrl, projectName, environment)
  monitorNetworkErrors(reportUrl, projectName, environment)
  monitorResourceErrors(reportUrl, projectName, environment)
}

export const VueErrorMonitorPlugin = {
  /**
   * Vue 插件安装函数
   *
   * @param {any} app - Vue 应用实例
   * @param {object} options - 插件配置项
   * @param {string} options.reportUrl - 上报错误服务端地址
   * @param {string} options.projectName - 项目名称
   * @param {string} options.environment - 当前环境
   */
  install(app: any, options: { reportUrl: string; projectName: string; environment: string }) {
    if (!options || !options.reportUrl) return
    if (!__monitorInitialized) {
      initErrorMonitor(options)
      __monitorInitialized = true
    }
    const cfg = app.config
    const original = cfg.errorHandler
    /**
     * 错误处理函数
     *
     * @param {unknown} err - 错误对象
     * @param {unknown} [instance] - Vue 实例
     * @param {unknown} [info] - 错误信息
     */
    cfg.errorHandler = (err: unknown, instance?: unknown, info?: unknown) => {
      const e = err as any
      sendErrorData(
        {
          message: formatErrorMessage(err),
          stack: e && e.stack ? e.stack : null,
          projectName: options.projectName,
          environment: options.environment,
          errorType: 'Vue Error',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          info
        },
        options.reportUrl
      )
      if (typeof original === 'function') {
        try {
          ;(original as any)(err, instance, info)
        } catch {
          /* empty */
        }
      }
    }
  }
}
