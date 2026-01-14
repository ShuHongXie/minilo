export /**
 * @description 获取浏览器信息,解析 userAgent 获取浏览器名称和版本
 * @author xieshuhong
 * @return {{ name: string, version: string }} 包含浏览器名称和版本的对象
 */
const getBrowserInfo = () => {
  const ua = navigator.userAgent
  let tem
  const match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []
  if (/trident/i.test(match[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || []
    return { name: 'IE', version: tem[1] || '' }
  }
  if (match[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/)
    if (tem != null) {
      return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] }
    }
  }
  match[2] = match[2] || ''
  const name = match[1]
  const version = match[2]
  return { name, version }
}

/**
 * 格式化错误消息
 *
 * @param {any} err - 错误对象
 * @returns {string} 格式化后的错误字符串
 */
export const formatErrorMessage = (err: any): string => {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}
