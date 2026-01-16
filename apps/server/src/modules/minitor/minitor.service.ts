import { Injectable } from '@nestjs/common'
import { ApiErrorCode } from '@enums/responseCode.enum'
import sourceMap from 'source-map'
import Stacktracey from 'stacktracey'
import fs from 'fs'
import path from 'path'
import { ResultData } from '@utils/ResultData'

@Injectable()
export class MinitorService {
  readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { flag: 'r' }, (err, data) => {
        if (err) reject(err)
        else resolve(data.toString())
      })
    })
  }

  async analyze(error: string) {
    if (!error) {
      return ResultData.fail('错误栈信息不能为空', ApiErrorCode.COMMON_CODE)
    }
    // 读取Source Map文件， 直接读取dist目录下对应的map文件，真实情况是需要上传至服务器的
    const sourceMapFileContent: string = await this.readFile(
      path.resolve(process.cwd(), 'public', 'index-bUNAx0aa.js.map')
    )
    // 解析错误栈信息
    const tracey = new Stacktracey(error)
    const sourceMapContent = JSON.parse(sourceMapFileContent)
    // 根据source map文件创建SourceMapConsumer实例
    const consumer = await new sourceMap.SourceMapConsumer(sourceMapContent)

    // 获取第一条错误栈信息
    const errorInfo = tracey.items[0]

    // 根据打包后代码的错误位置解析出源码对应的错误信息位置
    const originalPosition = consumer.originalPositionFor({
      line: errorInfo.line || 0,
      column: errorInfo.column || 0
    })

    // 获取源码内容
    const sourceContent = originalPosition.source
      ? consumer.sourceContentFor(originalPosition.source)
      : ''
    console.log(tracey)
    console.log(errorInfo)
    console.log(originalPosition)
    // console.log(sourceContent)
    // 返回解析后的信息
    return ResultData.success('解析成功', {
      sourceContent,
      ...originalPosition
    })
  }
}
