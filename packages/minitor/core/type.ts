/**
 * 错误类型枚举（数字型）
 */
export enum ErrorType {
  /**
   * JavaScript 运行时错误
   */
  JAVASCRIPT_ERROR = 1,

  /**
   * 未处理的 Promise 异常
   */
  UNHANDLED_PROMISE_REJECTION = 2,

  /**
   * 网络错误
   */
  NETWORK_ERROR = 3,

  /**
   * Fetch 请求错误
   */
  FETCH_ERROR = 4,

  /**
   * 资源加载错误
   */
  RESOURCE_LOAD_ERROR = 5
}
