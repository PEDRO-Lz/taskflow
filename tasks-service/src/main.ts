import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { MikroORM } from '@mikro-orm/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // migrations
  const orm = app.get(MikroORM)
  await orm.schema.update()

  await app.listen(3002)
}
bootstrap()
