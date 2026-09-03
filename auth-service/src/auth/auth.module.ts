import { Module } from '@nestjs/common'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { JwtModule } from '@nestjs/jwt'
import { User } from './user.entity'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { SnsPublisher } from './sns-publisher.service'

@Module({
  imports: [
    MikroOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SnsPublisher],
})
export class AuthModule {}
