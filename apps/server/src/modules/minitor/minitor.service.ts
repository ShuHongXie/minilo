import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiErrorCode } from '@enums/responseCode.enum'
import sourceMap from 'source-map'
import Stacktracey from 'stacktracey'
import fs from 'fs'
import path from 'path'
import { ResultData } from '@utils/ResultData'
import { MinitorData, ErrorType } from './entities/minitor.entity'

@Injectable()
export class MinitorService {
  constructor(
    @InjectRepository(MinitorData)
    private readonly minitorDataRepository: Repository<MinitorData>
  ) {}

  readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { flag: 'r' }, (err, data) => {
        if (err) reject(err)
        else resolve(data.toString())
      })
    })
  }

  /**
   * 保存监控数据
   * @param data 监控数据
   * @returns 保存结果
   */
  async saveMinitorData(data: Partial<MinitorData>) {
    try {
      // 创建监控数据实例
      const minitorData = this.minitorDataRepository.create({
        ...data,
        // 确保 timestamp 是 Date 类型
        timestamp:
          data.timestamp instanceof Date
            ? data.timestamp
            : data.timestamp
              ? new Date(data.timestamp)
              : new Date()
      })

      // 保存到数据库
      const savedData = await this.minitorDataRepository.save(minitorData)

      return ResultData.success('保存监控数据成功', savedData)
    } catch (error) {
      console.error('保存监控数据失败:', error)
      return ResultData.fail('保存监控数据失败', ApiErrorCode.COMMON_CODE, {
        error: (error as Error).message
      })
    }
  }

  async analyze(error: string) {
    if (!error) {
      return ResultData.fail('错误栈信息不能为空', ApiErrorCode.COMMON_CODE)
    }
    // 读取Source Map文件， 直接读取dist目录下对应的map文件，真实情况是需要上传至服务器的
    const sourceMapFileContent: string = await this.readFile(
      path.resolve(process.cwd(), 'public', 'index-E7nb3sXL.js.map')
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

    // 返回解析后的信息
    return ResultData.success('解析成功', {
      sourceContent,
      ...originalPosition
    })
  }

  /**
   * 上传 sourcemap 文件
   * @param file 上传的文件
   * @returns 上传结果
   */
  async uploadSourcemap(file: Express.Multer.File) {
    try {
      // 确保目标目录存在 - 使用动态路径，适应不同操作系统
      const targetDir = path.resolve(process.cwd(), 'public')
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      // 生成目标文件路径
      const targetPath = path.join(targetDir, file.originalname)

      // 保存文件
      fs.writeFileSync(targetPath, file.buffer)

      return ResultData.success('Sourcemap 文件上传成功', {
        filename: file.originalname,
        path: targetPath
      })
    } catch (error) {
      console.error('上传 sourcemap 文件失败:', error)
      return ResultData.fail('Sourcemap 文件上传失败', ApiErrorCode.COMMON_CODE, {
        error: (error as Error).message
      })
    }
  }
}
