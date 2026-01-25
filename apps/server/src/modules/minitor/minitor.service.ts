import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiErrorCode } from '@enums/responseCode.enum'
import sourceMap from 'source-map'
import Stacktracey from 'stacktracey'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { ResultData } from '@utils/ResultData'
import { IPaginationOptions } from 'nestjs-typeorm-paginate'
import { paginateTransform } from '@utils/paginate'
import { CreateMinitorDto } from './dto/create-minitor.dto'
import { CreateMappingDto } from './dto/create-mapping.dto'
import { GetMinitorListDto } from './dto/get-minitor-list.dto'
import { GetProjectListDto } from './dto/get-project-list.dto'
import { CreateBlankDto } from './dto/create-blank.dto'
import { MinitorData, ErrorType } from './entities/minitor.entity'
import { MinitorBuild } from './entities/minitor-build.entity'
import { MinitorSourceMap } from './entities/minitor-sourcemap.entity'
import { MinitorBlank } from './entities/minitor-blank.entity'

@Injectable()
export class MinitorService {
  constructor(
    @InjectRepository(MinitorData)
    private readonly minitorDataRepository: Repository<MinitorData>,
    @InjectRepository(MinitorBuild)
    private readonly minitorBuildRepository: Repository<MinitorBuild>,
    @InjectRepository(MinitorSourceMap)
    private readonly minitorSourceMapRepository: Repository<MinitorSourceMap>,
    @InjectRepository(MinitorBlank)
    private readonly minitorBlankRepository: Repository<MinitorBlank>
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
  async saveMinitorData(data: CreateMinitorDto) {
    try {
      // 1. 生成堆栈哈希值
      const stack = data.stack || ''
      const stackHash = crypto.createHash('md5').update(stack).digest('hex')

      // 2. 检查是否已存在相同的错误记录（同一项目、同一版本、同一消息和堆栈哈希）
      const existing = await this.minitorDataRepository.findOne({
        where: {
          projectName: data.projectName,
          buildVersion: data.buildVersion,
          message: data.message,
          stackHash: stackHash
        }
      })

      if (existing) {
        return ResultData.success('错误记录已存在，跳过插入', existing)
      }

      // 3. 处理 errorType
      let errorType: ErrorType | undefined
      if (typeof data.errorType === 'string') {
        const num = parseInt(data.errorType, 10)
        errorType = isNaN(num) ? undefined : (num as ErrorType)
      } else {
        errorType = data.errorType
      }

      // 4. 创建监控数据实例
      const minitorData = this.minitorDataRepository.create({
        ...data,
        errorType,
        stackHash,
        // 确保 timestamp 是 Date 类型
        timestamp:
          data.timestamp instanceof Date
            ? data.timestamp
            : data.timestamp
              ? new Date(data.timestamp)
              : new Date()
      } as any)

      // 5. 保存到数据库
      const savedData = await this.minitorDataRepository.save(minitorData)

      return ResultData.success('保存监控数据成功', savedData)
    } catch (error) {
      console.error('保存监控数据失败:', error)
      return ResultData.fail('保存监控数据失败', ApiErrorCode.COMMON_CODE, {
        error: (error as Error).message
      })
    }
  }

  /**
   * 保存 Mapping 信息 (构建版本与 SourceMap 关联)
   * @param data Mapping 数据
   * @returns 保存结果
   */
  async saveMapping(data: CreateMappingDto) {
    try {
      // 1. 查找或创建构建版本记录
      // 注意：这里使用 buildVersion 作为构建的子一标识，即使有缓存，不同构建版本也应分别记录
      let build = await this.minitorBuildRepository.findOne({
        where: {
          projectName: data.projectName,
          buildVersion: data.buildVersion
        }
      })

      if (!build) {
        build = this.minitorBuildRepository.create({
          projectName: data.projectName,
          buildVersion: data.buildVersion
        })
        build = await this.minitorBuildRepository.save(build)
      }

      // 2. 检查该 SourceMap 是否已存在
      const existingMap = await this.minitorSourceMapRepository.findOne({
        where: {
          jsFilename: data.jsFilename,
          mapFilename: data.mapFilename,
          build: { id: build.id }
        }
      })

      if (existingMap) {
        return ResultData.success('SourceMap 记录已存在，无需重新上传', {
          ...existingMap,
          isNew: false,
          alreadyExists: true
        })
      }

      // 3. 创建 SourceMap 记录
      const sourceMap = this.minitorSourceMapRepository.create({
        jsFilename: data.jsFilename,
        mapFilename: data.mapFilename,
        cosUrl: data.cosUrl,
        build: build
      })

      const savedMap = await this.minitorSourceMapRepository.save(sourceMap)
      return ResultData.success('保存 Mapping 记录成功', {
        ...savedMap,
        isNew: true,
        alreadyExists: false
      })
    } catch (error) {
      console.error('[saveMapping] 保存失败:', error)
      return ResultData.fail('保存 Mapping 记录失败', ApiErrorCode.COMMON_CODE, {
        error: (error as Error).message
      })
    }
  }

  /**
   * 保存白屏检测数据
   * @param data 白屏数据
   * @returns 保存结果
   */
  async saveBlankData(data: CreateBlankDto) {
    try {
      const blankData = this.minitorBlankRepository.create({
        ...data,
        routeQuery: data.routeQuery ? JSON.stringify(data.routeQuery) : null,
        routeParams: data.routeParams ? JSON.stringify(data.routeParams) : null,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      } as any)

      const savedData = await this.minitorBlankRepository.save(blankData)
      return ResultData.success('保存白屏数据成功', savedData)
    } catch (error) {
      console.error('保存白屏数据失败:', error)
      return ResultData.fail('保存白屏数据失败', ApiErrorCode.COMMON_CODE, {
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

  /**
   * 获取项目列表（去重保留同名项目中最新的构建）
   * @param queryDto 查询参数
   * @returns 项目列表
   */
  async getProjectList(queryDto: GetProjectListDto) {
    try {
      const { currentPage, pageSize } = queryDto

      // 子查询：获取每个项目名称对应的最大 ID（即最新的构建）
      const subQuery = this.minitorBuildRepository
        .createQueryBuilder('sub')
        .select('MAX(sub.id)')
        .groupBy('sub.projectName')

      const queryBuilder = this.minitorBuildRepository
        .createQueryBuilder('mb')
        .where(`mb.id IN (${subQuery.getQuery()})`)
        .orderBy('mb.createTime', 'DESC')

      const paginationOptions: IPaginationOptions = {
        page: currentPage,
        limit: pageSize
      }

      const result = await paginateTransform<MinitorBuild>(queryBuilder, paginationOptions)

      return ResultData.success('获取项目列表成功', result)
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return ResultData.fail('获取项目列表失败', ApiErrorCode.COMMON_CODE)
    }
  }

  /**
   * 获取项目报错列表（带分页）
   * @param queryDto 查询参数
   * @returns 报错列表
   */
  async getMinitorList(queryDto: GetMinitorListDto) {
    try {
      const { projectName, buildId, currentPage, pageSize } = queryDto

      const queryBuilder = this.minitorDataRepository.createQueryBuilder('minitor')

      // 如果提供了 buildId，则需要先找到对应的项目和版本
      if (buildId) {
        const build = await this.minitorBuildRepository.findOneBy({ id: buildId })
        if (build) {
          queryBuilder.andWhere('minitor.projectName = :pName', { pName: build.projectName })
          queryBuilder.andWhere('minitor.buildVersion = :bVer', { bVer: build.buildVersion })
        } else {
          return ResultData.fail('未找到指定的构建版本', ApiErrorCode.COMMON_CODE)
        }
      } else if (projectName) {
        // 如果没有提供 buildId 但提供了 projectName，则查询该项目下的所有报错
        queryBuilder.andWhere('minitor.projectName = :projectName', { projectName })
      } else {
        return ResultData.fail('请指定项目或构建 ID', ApiErrorCode.COMMON_CODE)
      }

      queryBuilder.orderBy('minitor.timestamp', 'DESC') // 按时间倒序

      const paginationOptions: IPaginationOptions = {
        page: currentPage,
        limit: pageSize
      }

      const result = await paginateTransform<MinitorData>(queryBuilder, paginationOptions)

      return ResultData.success('获取报错列表成功', result)
    } catch (error) {
      console.error('获取监控数据列表失败:', error)
      return ResultData.fail('获取监控数据列表失败', ApiErrorCode.COMMON_CODE)
    }
  }
}
