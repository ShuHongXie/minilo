import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MinitorService } from './minitor.service'
import { ApiOperation } from '@nestjs/swagger'
import { Public } from '@decorator/public.decorator'
import { CreateMinitorDto } from './dto/create-minitor.dto'
import { CreateMappingDto } from './dto/create-mapping.dto'
import { ErrorType } from './entities/minitor.entity'

interface ErrorStack {
  error: string
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
  report(@Body() data: CreateMinitorDto) {
    console.log('上报的监控数据:', data)
    return this.minitorService.saveMinitorData(data)
  }

  @Post('/mapping')
  @ApiOperation({ summary: '上报 sourcemap 映射关系' })
  @Public()
  saveMapping(@Body() data: CreateMappingDto) {
    return this.minitorService.saveMapping(data)
  }
}
