import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateMappingDto {
  @IsString()
  @IsNotEmpty()
  projectName: string

  @IsString()
  @IsNotEmpty()
  buildVersion: string

  @IsString()
  @IsNotEmpty()
  jsFilename: string

  @IsString()
  @IsNotEmpty()
  mapFilename: string

  @IsString()
  @IsOptional()
  cosUrl?: string
}
