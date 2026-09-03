import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/postgresql'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { User } from './user.entity'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: EntityRepository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ email: dto.email })
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    })

    await this.users.getEntityManager().flush()

    return { id: user.id, email: user.email, name: user.name }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ email: dto.email })
    const valid =
      user && (await bcrypt.compare(dto.password, user.passwordHash))

    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas.')
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    })
    return { accessToken }
  }
}
