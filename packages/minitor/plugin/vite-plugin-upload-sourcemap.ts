// vite-plugin-upload-sourcemap.ts
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'
import { buildVersion as defaultBuildVersion } from './utils'

/**
 * 插件配置选项类型定义
 */
export interface UploadSourcemapOptions {
  /** 构建输出目录，默认 'dist' */
  outputDir?: string
  /** 上传后是否删除本地sourcemap文件，默认 true */
  deleteAfterUpload?: boolean
  /** 自定义上传函数（可选，替代内置的模拟上传） */
  customUpload?: (filePath: string, fileName: string) => Promise<boolean>
  /** 项目名称（如my-vue-project），必填 */
  projectName: string
  /** 构建版本/标识（如v1.0.2_20260122），可选，默认使用 utils.ts 中的 buildVersion */
  buildVersion?: string
  /** 后端mapping接口地址，默认 '/api/mapping' */
  mappingApiUrl?: string
  /** 腾讯云COS配置 */
  cosConfig?: {
    /** COS SecretId */
    secretId: string
    /** COS SecretKey */
    secretKey: string
    /** COS Bucket */
    bucket: string
    /** COS Region */
    region: string
    /** COS 存储路径前缀，默认 'sourcemaps/' */
    cosPathPrefix?: string
  }
}

/**
 * 默认上传函数（使用腾讯云 COS）
 * @param filePath sourcemap文件的绝对路径
 * @param fileName sourcemap文件名
 * @param cosConfig COS配置
 * @returns 上传结果，包含是否成功和cosUrl
 */
async function defaultUploadSourcemap(
  filePath: string,
  fileName: string,
  cosConfig?: UploadSourcemapOptions['cosConfig']
): Promise<{ success: boolean; cosUrl?: string }> {
  console.log(`开始上传 sourcemap 文件: ${fileName}`)

  if (!cosConfig) {
    console.error('❌ 缺少 COS 配置，无法上传 sourcemap 文件')
    return { success: false }
  }

  try {
    // 动态导入 COS SDK
    const COS = (await import('cos-nodejs-sdk-v5')).default
    const cos = new COS({
      SecretId: cosConfig.secretId,
      SecretKey: cosConfig.secretKey
    })

    const cosPathPrefix = `${defaultBuildVersion}/${cosConfig.cosPathPrefix}`
    const cosKey = `${cosPathPrefix}${fileName}`

    // 读取文件内容
    const fileContent = await fs.readFile(filePath)

    // 上传到 COS
    await new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: cosKey,
          Body: fileContent
        },
        (err, data) => {
          if (err) reject(err)
          else resolve(data)
        }
      )
    })

    // 生成 COS 访问地址
    const cosUrl = `https://${cosConfig.bucket}.cos.${cosConfig.region}.myqcloud.com/${cosKey}`

    console.log(`✅ ${fileName} 上传完成`)
    return { success: true, cosUrl }
  } catch (error) {
    console.error(`上传 ${fileName} 到 COS 失败:`, error)
    return { success: false }
  }
}

/**
 * 递归查找目录下所有的sourcemap文件
 * @param dir 要查找的目录路径
 * @returns 所有sourcemap文件的绝对路径数组
 */
async function findSourcemapFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // 递归查找子目录
      files.push(...(await findSourcemapFiles(fullPath)))
    } else if (entry.isFile() && path.extname(entry.name) === '.map') {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * 调用后端接口创建 mapping 记录
 * @param mappingData mapping 数据
 * @param apiUrl 后端接口地址
 * @returns 返回结果对象，包含是否成功和是否为新记录
 */
async function createMappingRecord(
  mappingData: any,
  apiUrl: string
): Promise<{ success: boolean; isNew?: boolean; alreadyExists?: boolean }> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mappingData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ 调用后端接口创建 mapping 记录失败: ${response.status} ${errorText}`)
      return { success: false }
    }

    const result = await response.json()
    return {
      success: true,
      isNew: result.data?.isNew ?? true,
      alreadyExists: result.data?.alreadyExists ?? false
    }
  } catch (error) {
    console.error('❌ 调用后端接口失败:', error)
    return { success: false }
  }
}

/**
 * Vite插件：构建后上传sourcemap文件
 * @param options 插件配置选项
 * @returns Vite插件对象
 */
export function vitePluginUploadSourcemap(options: UploadSourcemapOptions): Plugin {
  // 合并默认配置
  const {
    outputDir = 'dist',
    deleteAfterUpload = true,
    customUpload,
    projectName,
    buildVersion = defaultBuildVersion,
    mappingApiUrl = '/minitor/mapping',
    cosConfig
  } = options

  console.log(
    '[vitePluginUploadSourcemap] 插件初始化: projectName=%s, buildVersion=%s',
    projectName,
    buildVersion
  )

  // 验证必填配置
  if (!projectName) {
    throw new Error('❌ 缺少必填配置：projectName')
  }

  return {
    name: 'vite-plugin-upload-sourcemap', // 插件名称（必填）
    // 构建完成后触发的钩子（Vite官方生命周期）
    async closeBundle() {
      try {
        // 使用项目根目录解析输出目录
        const distAbsolutePath = path.resolve(process.cwd(), outputDir)
        // 1. 查找所有sourcemap文件
        const sourcemapFiles = await findSourcemapFiles(distAbsolutePath)
        if (sourcemapFiles.length === 0) {
          console.log('⚠️ 未找到任何sourcemap文件，请检查vite.config.ts中build.sourcemap配置')
          return
        }
        console.log('sourcemapFiles:', sourcemapFiles)

        // 2. 逐个上传并可选删除
        for (const filePath of sourcemapFiles) {
          const fileName = path.basename(filePath)
          const jsFileName = fileName.replace('.map', '')
          const mappingData = {
            projectName,
            buildVersion,
            jsFilename: jsFileName,
            mapFilename: fileName,
            cosUrl: ''
          }
          console.log('[映射数据] 准备发送:', JSON.stringify(mappingData, null, 2))

          // 2.1 先检查该映射记录是否已存在
          const mappingCheckResult = await createMappingRecord(mappingData, mappingApiUrl)

          if (mappingCheckResult.success && mappingCheckResult.alreadyExists) {
            // 记录已存在，无需上传
            console.log(`⏭️ SourceMap 映射记录已存在，跳过上传: ${fileName}`)
            continue
          }

          // 2.2 记录不存在或首次创建，需要上传 COS
          let uploadResult: { success: boolean; cosUrl?: string }

          // 执行上传
          if (customUpload) {
            // 使用自定义上传函数
            const success = await customUpload(filePath, fileName)
            uploadResult = { success }
          } else {
            // 使用默认上传函数
            uploadResult = await defaultUploadSourcemap(filePath, fileName, cosConfig)
          }
          if (uploadResult.success) {
            // 2.3 上传成功后创建/更新 mapping 记录
            const finalMappingData = {
              ...mappingData,
              cosUrl: uploadResult.cosUrl || ''
            }
            await createMappingRecord(finalMappingData, mappingApiUrl)

            // 2.4 可选删除本地文件
            if (deleteAfterUpload) {
              await fs.unlink(filePath)
              console.log(`🗑️ 已删除本地sourcemap文件: ${fileName}`)
            }
          }
        }

        console.log(`🎉 所有sourcemap文件处理完成（共${sourcemapFiles.length}个）`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('❌ sourcemap上传/删除失败:', errorMsg)
        // 可选：上传失败时终止构建（根据业务需求开启）
        // throw error;
      }
    }
  }
}
