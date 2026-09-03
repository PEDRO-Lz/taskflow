import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('AuthController (e2e)', () => {
  let app: INestApplication
  const password = '12345678'
  const email = `auth-e2e-${Date.now()}@teste.com`

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /auth/register', () => {
    it('cria o usuário e não devolve a senha', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, name: 'E2E', password })
        .expect(201)

      expect(res.body).toMatchObject({ email, name: 'E2E' })
      expect(res.body.id).toEqual(expect.any(String))
      expect(res.body.passwordHash).toBeUndefined()
    })

    it('rejeita e-mail já cadastrado com 409', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, name: 'E2E de novo', password })
        .expect(409)
    })

    it('rejeita senha curta com 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `outro-${Date.now()}@teste.com`,
          name: 'E2E',
          password: '123',
        })
        .expect(400)
    })
  })

  describe('POST /auth/login', () => {
    it('devolve um accessToken pra credenciais corretas', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201)

      expect(typeof res.body.accessToken).toBe('string')
    })

    it('rejeita senha errada com 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'senha-errada' })
        .expect(401)
    })

    it('rejeita e-mail inexistente com 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `nao-existe-${Date.now()}@teste.com`, password })
        .expect(401)
    })
  })
})
