import { IsString } from 'class-validator'

export class AddCardDto {
  @IsString()
  title!: string
}
