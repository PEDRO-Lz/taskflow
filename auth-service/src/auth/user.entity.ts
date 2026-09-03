import { defineEntity, p } from '@mikro-orm/postgresql'
import { randomUUID } from 'crypto'

const UserSchema = defineEntity({
  name: 'User',
  tableName: 'users',
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => randomUUID()),
    email: p.string().unique(),
    name: p.string(),
    passwordHash: p.string().hidden(),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
})

export class User extends UserSchema.class {}
UserSchema.setClass(User)
