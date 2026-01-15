import { PartialType } from '@nestjs/swagger'
import { CreateMinitorDto } from './create-minitor.dto'

export class UpdateMinitorDto extends PartialType(CreateMinitorDto) {}
