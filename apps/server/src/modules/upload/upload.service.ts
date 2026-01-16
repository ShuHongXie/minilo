import { ApiErrorCode } from '@enums/responseCode.enum'
import { Injectable } from '@nestjs/common'
import { ResultData } from '@utils/ResultData'

@Injectable()
export class UploadService {
  /**
   * 上传图片（固定返回测试链接）
   */
  uploadImage(file: Express.Multer.File) {
    // 这里暂时固定返回一个图片链接，实际项目中应该将文件上传到云存储或本地存储
    const imageUrl =
      'https://egc-ipc-prd-1306540153.cos.ap-guangzhou.myqcloud.com/2025/20251219162257067RFGJWPypH3HqwN1.jpg'

    return ResultData.success('上传成功', {
      url: imageUrl,
      fileName: file?.originalname || 'test.jpg',
      fileSize: file?.size || 0
    })
  }

  upload(file: Express.Multer.File) {
    if (!file) {
      return ResultData.fail('请上传文件')
    }

    const fs = require('fs')
    const path = require('path')

    const uploadDir = path.join(__dirname, '../../../public/uploads')

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const ext = path.extname(file.originalname)
    const fileName = `${timestamp}_${randomStr}${ext}`
    const filePath = path.join(uploadDir, fileName)

    fs.writeFileSync(filePath, file.buffer)

    const fileUrl = `/static/uploads/${fileName}`

    return ResultData.success('上传成功', {
      url: fileUrl,
      fileName: file.originalname,
      fileSize: file.size
    })
  }
}
