import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator'

export class CreateBlankDto {
  @IsNotEmpty()
  @IsString()
  projectName: string

  @IsNotEmpty()
  @IsString()
  buildVersion: string

  @IsNumber()
  emptyPoints: number

  @IsNumber()
  totalPoints: number

  @IsString()
  screen: string

  @IsString()
  viewPoint: string

  @IsString()
  selector: string

  @IsString()
  pagePath: string

  @IsOptional()
  @IsString()
  pageName?: string

  @IsOptional()
  @IsString()
  userId?: string

  @IsString()
  uuid: string

  @IsBoolean()
  isMobile: boolean

  @IsString()
  scene: string

  @IsNumber()
  pageLoadTime: number

  @IsOptional()
  @IsObject()
  routeQuery?: Record<string, any>

  @IsOptional()
  @IsObject()
  routeParams?: Record<string, any>

  @IsOptional()
  timestamp?: string | Date
}
