import { Global, Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './jwt.strategy'
import { JwtAuthGuard } from './jwt-auth.guard'

const passportModule = PassportModule.register({ defaultStrategy: 'jwt' })

@Global()
@Module({
  imports: [passportModule],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [passportModule, JwtAuthGuard],
})
export class AuthModule {}
