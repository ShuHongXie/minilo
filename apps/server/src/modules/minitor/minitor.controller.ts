import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { MinitorService } from './minitor.service'
import { CreateMinitorDto } from './dto/create-minitor.dto'
import { UpdateMinitorDto } from './dto/update-minitor.dto'

@Controller('minitor')
export class MinitorController {
  constructor(private readonly minitorService: MinitorService) {}

  @Post()
  create(@Body() createMinitorDto: CreateMinitorDto) {
    return this.minitorService.create(createMinitorDto)
  }

  @Get()
  findAll() {
    return this.minitorService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.minitorService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMinitorDto: UpdateMinitorDto) {
    return this.minitorService.update(+id, updateMinitorDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.minitorService.remove(+id)
  }
}
