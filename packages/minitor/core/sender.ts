import { getBrowserInfo } from './utils'

/**
 * @description 优先使用navigator.sendBeacon方法发送数据，如果浏览器不支持则回退到fetch API。
 * sendBeacon方法在页面卸载时也能可靠地发送数据。
 * @author xieshuhong
 * @param {Record<string, any>} errorData 要发送的错误数据对象
 * @param {string} url 目标API端点URL
 */
export const sendErrorData = (errorData: Record<string, any>, url: string) => {
  console.log('sendErrorData', errorData, url)
  // 获取浏览器信息并合并到错误数据中
  // const browserInfo = getBrowserInfo()
  // const dataToSend = {
  //   ...errorData,
  //   ...browserInfo
  // }

  // if (navigator.sendBeacon) {
  //   const blob = new Blob([JSON.stringify(dataToSend)], { type: 'application/json' })
  //   navigator.sendBeacon(url, blob)
  // } else {
  //   fetch(url, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(dataToSend),
  //     keepalive: true // 即使页面关闭也能发送请求，作用类似 sendBeacon
  //   }).catch((error) => console.error('Error reporting failed:', error))
  // }
}
