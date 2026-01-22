import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MinitorService } from './minitor.service'
import { ApiOperation } from '@nestjs/swagger'
import { Public } from '@decorator/public.decorator'
import { ErrorType } from './entities/minitor.entity'

interface ErrorStack {
  error: string
}

interface MinitorReportData {
  message?: string
  source?: string
  lineno?: number
  colno?: number
  stack?: string
  projectName?: string
  environment?: string
  errorType?: ErrorType | string
  timestamp?: string | Date
  userAgent?: string
  url?: string
}

@Controller('minitor')
export class MinitorController {
  constructor(private readonly minitorService: MinitorService) {}

  @Post('/analyze')
  @ApiOperation({ summary: '根据报错信息获取分析结果' })
  @Public()
  analyze(@Body() errorStack: ErrorStack) {
    console.log(errorStack)

    return this.minitorService.analyze(errorStack.error)
  }

  @Post('/upload-sourcemap')
  @ApiOperation({ summary: '上传 sourcemap 文件' })
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  uploadSourcemap(@UploadedFile() file: Express.Multer.File) {
    return this.minitorService.uploadSourcemap(file)
  }

  @Post('/report')
  @ApiOperation({ summary: '上报监控数据' })
  @Public()
  report(@Body() data: MinitorReportData) {
    console.log('上报的监控数据:', data)

    return this.minitorService.saveMinitorData(data)
  }
}
