import { ErrorType } from '../entities/minitor.entity'

export class CreateMinitorDto {
  message?: string
  source?: string
  lineno?: number
  colno?: number
  stack?: string
  projectName?: string
  environment?: string
  errorType?: ErrorType | string
  timestamp?: string | Date
  userAgent?: string
  url?: string
  errorFilename?: string
}
