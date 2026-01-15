import { Module } from '@nestjs/common'
import { MinitorService } from './minitor.service'
import { MinitorController } from './minitor.controller'

@Module({
  controllers: [MinitorController],
  providers: [MinitorService]
})
export class MinitorModule {}
