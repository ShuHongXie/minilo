import { sendErrorData } from './sender'

/**
 * 开启网络错误监控
 * 劫持并监听 XMLHttpRequest 和 fetch 请求，捕获网络异常
 *
 * @param {string} reportUrl - 错误上报地址
 * @param {string} projectName - 项目名称
 * @param {string} environment - 运行环境
 */
export const monitorNetworkErrors = (
  reportUrl: string,
  projectName: string,
  environment: string
) => {
  // 劫持 XMLHttpRequest​
  // 保存原生的 open 方法，以便后续调用
  const originalXhrOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
    const _urlStr = typeof url === 'string' ? url : String(url)
    if (_urlStr.includes(reportUrl)) {
      return originalXhrOpen.apply(this, [method, url, ...args] as any)
    }
    // 监听 error 事件，当请求失败时触发
    this.addEventListener('error', () => {
      const errorInfo = {
        message: `Network Error: ${method} ${url}`,
        projectName,
        environment,
        errorType: 'Network Error',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
      console.log('network error', errorInfo)

      sendErrorData(errorInfo, reportUrl)
    })
    // 调用原生的 open 方法，保证正常请求流程
    return originalXhrOpen.apply(this, [method, url, ...args] as any)
  }

  // 劫持 fetch​
  // 保存原生的 fetch 方法
  const originalFetch = window.fetch
  window.fetch = async (input, init) => {
    const urlStr = input instanceof Request ? input.url : String(input)
    if (urlStr.includes(reportUrl)) {
      return originalFetch(input, init)
    }
    try {
      // 执行原生的 fetch 请求
      const response = await originalFetch(input, init)
      // 检查响应状态，如果不是 2xx 则视为错误
      if (!response.ok) {
        const errorInfo = {
          message: `Network Error: ${response.status} ${response.statusText}`,
          url: input instanceof Request ? input.url : input,
          projectName,
          environment,
          errorType: 'Fetch Error',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
        console.log('fetch error', errorInfo)
        sendErrorData(errorInfo, reportUrl)
      }
      return response
    } catch (error) {
      // 捕获 fetch 执行过程中的异常（如网络断开）
      const errorInfo = {
        message: `Fetch failed: ${input instanceof Request ? input.url : input}`,
        projectName,
        environment,
        errorType: 'Fetch Error',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
      sendErrorData(errorInfo, reportUrl)
      throw error
    }
  }
}
