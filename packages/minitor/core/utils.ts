/**
 * @description 获取浏览器信息,解析 userAgent 获取浏览器名称和版本
 * @author xieshuhong
 * @return {{ name: string, version: string }} 包含浏览器名称和版本的对象
 */
export const getBrowserInfo = () => {
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

/**
 * 从错误堆栈中提取第一个错误文件名
 * 解析堆栈信息,提取第一个有效的文件路径(包含行号和列号)
 *
 * @param {string | null | undefined} stack - 错误堆栈字符串
 * @returns {string | null} 提取出的文件名(如 'index-Cic8HWFC.js:161836:34'),如果无法提取则返回 null
 *
 * @example
 * const stack = `TypeError: Failed to fetch
 *   at window.fetch (http://172.18.108.26:8080/assets/index-Cic8HWFC.js:161836:34)
 *   at btnFetchClick (http://172.18.108.26:8080/assets/index-Cic8HWFC.js:77701:11)`
 * extractFirstErrorFile(stack) // 返回 'index-Cic8HWFC.js:161836:34'
 */
export const extractFirstErrorFile = (stack: string | null | undefined): string | null => {
  console.log('stack', stack)

  if (!stack || typeof stack !== 'string') {
    return null
  }
  // 正则匹配: http(s)://域名/路径/文件名:行号:列号
  // 示例: http://172.18.108.26:8080/assets/index-Cic8HWFC.js:161836:34
  const regex = /https?:\/\/[^/]+\/(?:.*\/)?(\S+\.js):(\d+):(\d+)/
  const match = stack.match(regex)

  if (match) {
    // match[1] 是文件名, match[2] 是行号, match[3] 是列号
    return `${match[1]}`
  }

  return null
}

/**
 * 生成错误的唯一标识（基于错误核心信息的哈希）
 * @param errorData 错误数据
 * @returns 唯一标识字符串
 */
export function generateErrorKey(errorData: Record<string, any>): string {
  // 提取错误核心特征：消息+堆栈+文件路径（保证同类型错误生成相同key）
  const keyStr = `${errorData.message || ''}-${errorData.stack || ''}`
  // 简单哈希（生产环境可替换为md5库，如crypto-js）
  return Array.from(new TextEncoder().encode(keyStr))
    .reduce((hash, char) => (hash << 5) - hash + char, 0)
    .toString()
}
