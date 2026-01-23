import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  OneToMany
} from 'typeorm'
import { MinitorSourceMap } from './minitor-sourcemap.entity'

@Entity('minitor_build')
@Unique(['projectName', 'buildVersion']) // 确保项目+版本唯一
export class MinitorBuild {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100, name: 'project_name' })
  projectName: string

  @Column({ type: 'varchar', length: 50, name: 'build_version' })
  buildVersion: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  // 一个版本对应多个 SourceMap 文件
  @OneToMany(() => MinitorSourceMap, (map) => map.build)
  sourceMaps: MinitorSourceMap[]
}
