import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { MikroORM } from '@mikro-orm/core'
import { AppModule } from './app.module'
import { RedisIoAdapter } from './redis-io.adapter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // adapter do socket.io compartilhado via Redis, faz broadcast chegar em
  // clients conectados em outra réplica
  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis()
  app.useWebSocketAdapter(redisIoAdapter)

  // migrations
  const orm = app.get(MikroORM)
  await orm.schema.update()

  await app.listen(3002)
}
bootstrap()
