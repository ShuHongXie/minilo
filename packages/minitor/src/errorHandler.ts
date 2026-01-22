import { sendErrorData } from './sender'
import { ErrorType } from './type'
import { extractFirstErrorFile } from './utils'

/**
 * 开启 JavaScript 错误监控
 * 监听并上报全局的 JavaScript 运行时错误和未处理的 Promise 异常
 *
 * @param {string} reportUrl - 错误上报的服务端接口地址
 * @param {string} projectName - 项目名称，用于在后台区分错误来源
 * @param {string} environment - 运行环境（如 'production', 'development'）
 */
export const monitorJavaScriptErrors = (
  reportUrl: string,
  projectName: string,
  environment: string
) => {
  // 保存原有的 onerror 处理函数，防止覆盖
  const originalOnError = window.onerror

  /**
   *  捕获未处理的 JavaScript 错误
   * @param message (string): 错误的描述信息（例如 "Uncaught ReferenceError: x is not defined"）。
   * @param source  (string): 发生错误的脚本文件的 URL。
   * @param lineno  (number): 错误发生的行号。
   * @param colno  (number): 错误发生的列号。
   * @param error  (Error Object): 包含详细堆栈信息（Stack Trace）的 Error 对象。这是最有用的部分，因为它能告诉你错误调用的上下文。
   */
  window.onerror = (message, source, lineno, colno, error) => {
    console.log('javascript error', message, source, lineno, colno, error)
    const stack = error ? error.stack : null
    const errorInfo = {
      message,
      source,
      lineno,
      colno,
      stack,
      errorFilename: extractFirstErrorFile(stack),
      projectName,
      environment,
      errorType: ErrorType.JAVASCRIPT_ERROR,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    console.log('javascript error', errorInfo)

    // 上报错误数据
    sendErrorData(errorInfo, reportUrl)

    // 如果原来有 onerror 处理函数,继续执行它
    // 这样做是为了不破坏宿主环境(例如用户自己写的或其他 SDK)已有的错误处理逻辑
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error)
    }
  }

  // 保存原有的处理函数
  const originalOnUnhandledRejection = window.onunhandledrejection
  // 捕获未处理的 Promise 错误
  window.onunhandledrejection = (event) => {
    const reason = (event as any).reason
    const stack = reason && reason.stack ? reason.stack : null
    const errorInfo = {
      message: reason ? reason.message || String(reason) : 'Unknown Promise Error',
      stack,
      errorFilename: extractFirstErrorFile(stack),
      projectName,
      environment,
      errorType: ErrorType.UNHANDLED_PROMISE_REJECTION,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    console.log('unhandledrejection-1', errorInfo, reason)

    // 上报错误数据
    sendErrorData(errorInfo, reportUrl)

    // 如果原来有处理函数,继续执行它
    // 保持对原有 Promise 错误处理逻辑的兼容性
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(window, event)
    }
  }
}
