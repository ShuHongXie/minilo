import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MinitorService } from './minitor.service'
import { MinitorController } from './minitor.controller'
import { MinitorData } from './entities/minitor.entity'
import { MinitorBuild } from './entities/minitor-build.entity'
import { MinitorSourceMap } from './entities/minitor-sourcemap.entity'
import { MinitorBlank } from './entities/minitor-blank.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MinitorData, MinitorBuild, MinitorSourceMap, MinitorBlank])],
  controllers: [MinitorController],
  providers: [MinitorService]
})
export class MinitorModule {}
