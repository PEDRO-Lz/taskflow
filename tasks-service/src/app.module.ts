import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import mikroOrmConfig from './mikro-orm.config'
import { BoardsModule } from './boards/boards.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule,
    BoardsModule,
  ],
})
export class AppModule {}
