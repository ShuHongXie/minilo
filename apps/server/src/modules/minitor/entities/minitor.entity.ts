import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, Unique } from 'typeorm'

export enum ErrorType {
  JAVASCRIPT_ERROR = 1,
  UNHANDLED_PROMISE_REJECTION = 2,
  NETWORK_ERROR = 3,
  FETCH_ERROR = 4,
  RESOURCE_LOAD_ERROR = 5
}

@Entity('minitor_data')
// 增加唯一约束：同一版本下，相同的堆栈哈希视为重复，不重复记录
// 注：message 是 TEXT 类型无法用于索引，改用 stackHash 作为去重标识
@Unique('idx_unique_error', ['projectName', 'buildVersion', 'stackHash'])
export class MinitorData {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'text', nullable: true })
  message: string

  @Column({ type: 'text', nullable: true })
  stack: string

  // 增加一个 stack 的哈希值字段，因为 text 字段不能直接做唯一索引
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'stack_hash' })
  stackHash: string

  @Column({ type: 'varchar', length: 100, name: 'project_name' })
  projectName: string

  @Column({ type: 'varchar', length: 50, name: 'build_version' })
  buildVersion: string

  @Column({ type: 'enum', enum: ErrorType, nullable: true })
  errorType: ErrorType

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorFilename: string

  @Column({ type: 'datetime', nullable: true })
  timestamp: Date

  @CreateDateColumn()
  createdAt: Date
}
