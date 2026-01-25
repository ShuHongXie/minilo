import { IsOptional, IsNumber } from 'class-validator'

export class GetProjectListDto {
  @IsOptional()
  @IsNumber()
  currentPage: number = 1

  @IsOptional()
  @IsNumber()
  pageSize: number = 10
}
