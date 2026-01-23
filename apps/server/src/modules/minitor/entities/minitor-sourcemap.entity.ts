// apps/server/src/modules/mapping/entities/minitor-sourcemap.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { MinitorBuild } from './minitor-build.entity'

@Entity('minitor_sourcemap')
export class MinitorSourceMap {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 200, name: 'js_filename' })
  jsFilename: string

  @Column({ type: 'varchar', length: 200, name: 'map_filename' })
  mapFilename: string

  @Column({ type: 'varchar', length: 500, name: 'cos_url' })
  cosUrl: string

  // 多对一关联到构建版本
  @ManyToOne(() => MinitorBuild, (build) => build.sourceMaps)
  @JoinColumn({ name: 'build_id' })
  build: MinitorBuild
}
