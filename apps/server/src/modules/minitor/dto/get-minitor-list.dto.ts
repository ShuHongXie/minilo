import { IsString, IsOptional, IsNumber } from 'class-validator'

export class GetMinitorListDto {
  @IsOptional()
  @IsNumber()
  buildId?: number

  @IsOptional()
  @IsString()
  projectName?: string

  @IsOptional()
  @IsNumber()
  currentPage: number = 1

  @IsOptional()
  @IsNumber()
  pageSize: number = 10
}
