import { IsEnum } from 'class-validator'
import { CardStatus } from '../card.entity'

export class MoveCardDto {
  @IsEnum(CardStatus)
  status!: CardStatus
}
