import { ApiErrorCode } from '../enums/responseCode.enum'
export class ResultData<T = any> {
  constructor(code = ApiErrorCode.SUCCESS, msg?: string, data?: T) {
    this.code = code
    this.msg = msg || 'success'
    this.data = data || null
  }

  code: number
  msg?: string
  data?: any

  static success(msg?: string, data: any = ''): ResultData {
    return new ResultData(ApiErrorCode.SUCCESS, msg, data)
  }

  static fail(msg?: string, code = ApiErrorCode.FAIL, data?: any): ResultData {
    console.log(code, msg, data)
    return new ResultData(code, msg || 'fail', data)
  }
}
