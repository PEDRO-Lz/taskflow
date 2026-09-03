import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { AppModule } from '../src/app.module'
import { SqsConsumer } from '../src/boards/sqs-consumer.service'
import { CardStatus } from '../src/boards/card.entity'

  let app: INestApplication
  let token: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SqsConsumer)
      .useValue({ onModuleInit: () => {} })
      .compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    token = jwt.sign({ sub: 'e2e-user', email: 'e2e@teste.com' }, process.env.JWT_SECRET!)
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejeita criar board sem token com 401', async () => {
    await request(app.getHttpServer())
      .post('/boards')
      .send({ title: 'Sem token', ownerId: 'e2e-user' })
      .expect(401)
  })

  it('rejeita token inválido com 401', async () => {
    await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', 'Bearer token-invalido')
      .send({ title: 'Token inválido', ownerId: 'e2e-user' })
      .expect(401)
  })

  it('cria board, adiciona card e move ele — fluxo completo', async () => {
    const board = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Board e2e', ownerId: 'e2e-user' })
      .expect(201)

    expect(board.body.id).toEqual(expect.any(String))
    const boardId = board.body.id

    const card = await request(app.getHttpServer())
      .post(`/boards/${boardId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card e2e' })
      .expect(201)

    expect(card.body.status).toBe(CardStatus.TODO)
    const cardId = card.body.id

    const moved = await request(app.getHttpServer())
      .patch(`/boards/${boardId}/cards/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: CardStatus.DOING })
      .expect(200)

    expect(moved.body.status).toBe(CardStatus.DOING)
  })

  it('rejeita card inexistente com 404', async () => {
    const board = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Board pra 404', ownerId: 'e2e-user' })
      .expect(201)

    await request(app.getHttpServer())
      .patch(`/boards/${board.body.id}/cards/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: CardStatus.DONE })
      .expect(404)
  })

  it('rejeita board inexistente com 404', async () => {
    await request(app.getHttpServer())
      .post('/boards/00000000-0000-0000-0000-000000000000/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card órfão' })
      .expect(404)
  })
})
