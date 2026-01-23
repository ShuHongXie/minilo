import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator'
import { ErrorType } from '../entities/minitor.entity'

export class CreateMinitorDto {
  @IsOptional()
  @IsString()
  message?: string

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsNumber()
  lineno?: number

  @IsOptional()
  @IsNumber()
  colno?: number

  @IsOptional()
  @IsString()
  stack?: string

  @IsNotEmpty()
  @IsString()
  projectName: string

  @IsOptional()
  @IsString()
  environment?: string

  @IsOptional()
  @IsEnum(ErrorType)
  errorType?: ErrorType | string

  @IsOptional()
  timestamp?: string | Date

  @IsOptional()
  @IsString()
  userAgent?: string

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsString()
  errorFilename?: string

  @IsNotEmpty()
  @IsString()
  buildVersion: string
}
