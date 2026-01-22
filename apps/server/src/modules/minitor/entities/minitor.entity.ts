import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

/**
 * 错误类型枚举（数字型）
 */
export enum ErrorType {
  /**
   * JavaScript 运行时错误
   */
  JAVASCRIPT_ERROR = 1,

  /**
   * 未处理的 Promise 异常
   */
  UNHANDLED_PROMISE_REJECTION = 2,

  /**
   * 网络错误
   */
  NETWORK_ERROR = 3,

  /**
   * Fetch 请求错误
   */
  FETCH_ERROR = 4,

  /**
   * 资源加载错误
   */
  RESOURCE_LOAD_ERROR = 5
}

/**
 * 监控数据实体
 * 用于存储前端上报的各种错误监控数据
 */
@Entity('minitor_data')
export class MinitorData {
  /**
   * 主键 ID
   */
  @PrimaryGeneratedColumn()
  id: number

  /**
   * 错误消息
   */
  @Column({ type: 'text', nullable: true })
  message: string

  /**
   * 错误来源（如脚本文件 URL）
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  source: string

  /**
   * 错误行号
   */
  @Column({ type: 'int', nullable: true })
  lineno: number

  /**
   * 错误列号
   */
  @Column({ type: 'int', nullable: true })
  colno: number

  /**
   * 错误堆栈信息
   */
  @Column({ type: 'text', nullable: true })
  stack: string

  /**
   * 项目名称
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  projectName: string

  /**
   * 运行环境（如 production, development）
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  environment: string

  /**
   * 错误类型
   */
  @Column({
    type: 'enum',
    enum: ErrorType,
    nullable: true
  })
  errorType: ErrorType

  /**
   * 错误发生的时间戳
   */
  @Column({ type: 'datetime', nullable: true })
  timestamp: Date

  /**
   * 用户代理信息
   */
  @Column({ type: 'text', nullable: true })
  userAgent: string

  /**
   * URL 地址（如网络请求的 URL）
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string

  /**
   * 记录创建时间
   */
  @CreateDateColumn()
  createdAt: Date
}
