import { defineEntity, p } from '@mikro-orm/postgresql'
import { randomUUID } from 'crypto'
import { Card } from './card.entity'

const BoardSchema = defineEntity({
  name: 'Board',
  tableName: 'boards',
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => randomUUID()),
    title: p.string(),
    ownerId: p.string(),
    cards: () => p.oneToMany(Card).mappedBy('board'),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
})

export class Board extends BoardSchema.class {}
BoardSchema.setClass(Board)
