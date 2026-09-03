import { defineEntity, p } from '@mikro-orm/postgresql'
import { randomUUID } from 'crypto'
import { Board } from './board.entity'

export enum CardStatus {
  TODO = 'todo',
  DOING = 'doing',
  DONE = 'done',
}

const CardSchema = defineEntity({
  name: 'Card',
  tableName: 'cards',
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => randomUUID()),
    title: p.string(),
    status: p.enum(() => CardStatus).default(CardStatus.TODO),
    board: () => p.manyToOne(Board).inversedBy('cards'),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
})

export class Card extends CardSchema.class {}
CardSchema.setClass(Card)
