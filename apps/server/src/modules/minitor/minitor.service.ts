import { Injectable } from '@nestjs/common'
import { CreateMinitorDto } from './dto/create-minitor.dto'
import { UpdateMinitorDto } from './dto/update-minitor.dto'

@Injectable()
export class MinitorService {
  create(createMinitorDto: CreateMinitorDto) {
    return 'This action adds a new minitor'
  }

  findAll() {
    return `This action returns all minitor`
  }

  findOne(id: number) {
    return `This action returns a #${id} minitor`
  }

  update(id: number, updateMinitorDto: UpdateMinitorDto) {
    return `This action updates a #${id} minitor`
  }

  remove(id: number) {
    return `This action removes a #${id} minitor`
  }
}
