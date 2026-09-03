import { defineConfig } from '@mikro-orm/postgresql'
import { Board } from './boards/board.entity'
import { Card } from './boards/card.entity'

export default defineConfig({
  entities: [Board, Card],
  dbName: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  debug: false,
  allowGlobalContext: true,
})
