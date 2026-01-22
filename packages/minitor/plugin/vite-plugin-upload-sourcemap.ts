// vite-plugin-upload-sourcemap.ts
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'

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
}

/**
 * 模拟上传函数（可被自定义上传函数替换）
 * @param filePath sourcemap文件的绝对路径
 * @param fileName sourcemap文件名
 * @returns 上传是否成功
 */
async function defaultUploadSourcemap(filePath: string, fileName: string): Promise<boolean> {
  console.log(`开始上传 sourcemap 文件: ${fileName}`)

  // 替换为腾讯云 COS 上传逻辑（需安装 cos-nodejs-sdk-v5 依赖：pnpm add cos-nodejs-sdk-v5 -D）
  /*
  import COS from 'cos-nodejs-sdk-v5'
  const cos = new COS({
    SecretId: 'YOUR_SECRET_ID', // 替换为你的 SecretId
    SecretKey: 'YOUR_SECRET_KEY' // 替换为你的 SecretKey
  })

  try {
    await new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: 'YOUR_BUCKET', // 替换为你的 Bucket，格式：test-1250000000
          Region: 'YOUR_REGION', // 替换为你的 Region，如 ap-guangzhou
          Key: `sourcemaps/${fileName}`, // 存储到 COS 的路径
          Body: await fs.readFile(filePath) // fs 是 fs/promises
        },
        (err, data) => {
          if (err) reject(err)
          else resolve(data)
        }
      )
    })
  } catch (error) {
    console.error(`上传 ${fileName} 到 COS 失败:`, error)
    return false
  }
  */

  // 模拟上传延迟
  await new Promise<void>((resolve) => setTimeout(resolve, 1000))
  console.log(`✅ ${fileName} 上传完成`)
  return true
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
 * Vite插件：构建后上传sourcemap文件
 * @param options 插件配置选项
 * @returns Vite插件对象
 */
export default function vitePluginUploadSourcemap(options: UploadSourcemapOptions = {}): Plugin {
  // 合并默认配置
  const {
    outputDir = 'dist',
    deleteAfterUpload = true,
    customUpload = defaultUploadSourcemap
  } = options

  return {
    name: 'vite-plugin-upload-sourcemap', // 插件名称（必填）
    // 构建完成后触发的钩子（Vite官方生命周期）
    async closeBundle() {
      // 处理ES模块下的__dirname（TS兼容写法）
      const __dirname = path.dirname(fileURLToPath(import.meta.url))
      const distAbsolutePath = path.resolve(__dirname, outputDir)

      try {
        // 1. 查找所有sourcemap文件
        const sourcemapFiles = await findSourcemapFiles(distAbsolutePath)
        if (sourcemapFiles.length === 0) {
          console.log('⚠️ 未找到任何sourcemap文件，请检查vite.config.ts中build.sourcemap配置')
          return
        }

        // 2. 逐个上传并可选删除
        for (const filePath of sourcemapFiles) {
          const fileName = path.basename(filePath)
          // 执行上传（优先使用自定义上传函数）
          const uploadSuccess = await customUpload(filePath, fileName)

          if (uploadSuccess && deleteAfterUpload) {
            // 3. 上传成功后删除本地文件
            await fs.unlink(filePath)
            console.log(`🗑️ 已删除本地sourcemap文件: ${fileName}`)
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
