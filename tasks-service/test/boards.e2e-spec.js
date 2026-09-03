'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }

Object.defineProperty(exports, '__esModule', { value: true })

const common_1 = require('@nestjs/common')
const testing_1 = require('@nestjs/testing')
const supertest_1 = __importDefault(require('supertest'))
const jsonwebtoken_1 = __importDefault(require('jsonwebtoken'))
const app_module_1 = require('../src/app.module')
const sqs_consumer_service_1 = require('../src/boards/sqs-consumer.service')
const card_entity_1 = require('../src/boards/card.entity')

describe('BoardsController (e2e)', () => {
  let app
  let token
  beforeAll(async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
      imports: [app_module_1.AppModule],
    })
      .overrideProvider(sqs_consumer_service_1.SqsConsumer)
      .useValue({ onModuleInit: () => {} })
      .compile()
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new common_1.ValidationPipe({ whitelist: true, transform: true }),
    )
    await app.init()
    token = jsonwebtoken_1.default.sign(
      { sub: 'e2e-user', email: 'e2e@teste.com' },
      process.env.JWT_SECRET,
    )
  })
  afterAll(async () => {
    await app.close()
  })
  it('rejeita criar board sem token com 401', async () => {
    await (0, supertest_1.default)(app.getHttpServer())
      .post('/boards')
      .send({ title: 'Sem token', ownerId: 'e2e-user' })
      .expect(401)
  })
  it('rejeita token inválido com 401', async () => {
    await (0, supertest_1.default)(app.getHttpServer())
      .post('/boards')
      .set('Authorization', 'Bearer token-invalido')
      .send({ title: 'Token inválido', ownerId: 'e2e-user' })
      .expect(401)
  })
  it('cria board, adiciona card e move ele — fluxo completo', async () => {
    const board = await (0, supertest_1.default)(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Board e2e', ownerId: 'e2e-user' })
      .expect(201)
    expect(board.body.id).toEqual(expect.any(String))
    const boardId = board.body.id
    const card = await (0, supertest_1.default)(app.getHttpServer())
      .post(`/boards/${boardId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card e2e' })
      .expect(201)
    expect(card.body.status).toBe(card_entity_1.CardStatus.TODO)
    const cardId = card.body.id
    const moved = await (0, supertest_1.default)(app.getHttpServer())
      .patch(`/boards/${boardId}/cards/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: card_entity_1.CardStatus.DOING })
      .expect(200)
    expect(moved.body.status).toBe(card_entity_1.CardStatus.DOING)
  })
  it('rejeita card inexistente com 404', async () => {
    const board = await (0, supertest_1.default)(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Board pra 404', ownerId: 'e2e-user' })
      .expect(201)
    await (0, supertest_1.default)(app.getHttpServer())
      .patch(
        `/boards/${board.body.id}/cards/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ status: card_entity_1.CardStatus.DONE })
      .expect(404)
  })
  it('rejeita board inexistente com 404', async () => {
    await (0, supertest_1.default)(app.getHttpServer())
      .post('/boards/00000000-0000-0000-0000-000000000000/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card órfão' })
      .expect(404)
  })
})
//# sourceMappingURL=boards.e2e-spec.js.map
