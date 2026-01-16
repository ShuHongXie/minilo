import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { MinitorService } from './minitor.service'
import { ApiOperation } from '@nestjs/swagger'
import { Public } from '@decorator/public.decorator'

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
}
