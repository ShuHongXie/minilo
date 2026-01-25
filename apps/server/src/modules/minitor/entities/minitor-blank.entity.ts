import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('minitor_blank')
export class MinitorBlank {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100, name: 'project_name' })
  projectName: string

  @Column({ type: 'varchar', length: 50, name: 'build_version' })
  buildVersion: string

  @Column({ type: 'int', name: 'empty_points' })
  emptyPoints: number

  @Column({ type: 'int', name: 'total_points' })
  totalPoints: number

  @Column({ type: 'varchar', length: 50 })
  screen: string

  @Column({ type: 'varchar', length: 50, name: 'view_point' })
  viewPoint: string

  @Column({ type: 'varchar', length: 255 })
  selector: string

  @Column({ type: 'varchar', length: 255, name: 'page_path' })
  pagePath: string

  @Column({ type: 'varchar', length: 100, name: 'page_name', nullable: true })
  pageName: string

  @Column({ type: 'varchar', length: 100, name: 'user_id', nullable: true })
  userId: string

  @Column({ type: 'varchar', length: 100 })
  uuid: string

  @Column({ type: 'boolean', name: 'is_mobile' })
  isMobile: boolean

  @Column({ type: 'varchar', length: 20 })
  scene: string

  @Column({ type: 'int', name: 'page_load_time' })
  pageLoadTime: number

  @Column({ type: 'text', name: 'route_query', nullable: true })
  routeQuery: string

  @Column({ type: 'text', name: 'route_params', nullable: true })
  routeParams: string

  @Column({ type: 'datetime' })
  timestamp: Date

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date
}
