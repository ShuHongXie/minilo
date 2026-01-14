import { sendErrorData } from './sender'

/**
 * 开启资源加载错误监控
 * 监听图片、脚本等资源加载失败的错误
 *
 * @param {string} reportUrl - 错误上报地址
 * @param {string} projectName - 项目名称
 * @param {string} environment - 运行环境
 */
export const monitorResourceErrors = (
  reportUrl: string,
  projectName: string,
  environment: string
) => {
  /**
   * 监听全局 error 事件
   * 注意：资源加载错误不会冒泡，所以必须在捕获阶段处理 (useCapture = true)
   */
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement
      // 过滤出 IMG 和 SCRIPT 标签的错误
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT')) {
        const errorInfo = {
          message: `Resource Load Error: ${target.tagName} ${target.getAttribute('src') || target.getAttribute('href')}`,
          projectName,
          environment,
          errorType: 'Resource Load Error',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
        sendErrorData(errorInfo, reportUrl)
      }
    },
    true
  ) // useCapture 为 true 确保资源错误被捕获
}
