### Para a build completa
```bash
docker-compose up --build
```

### Para rodar os services no host
```bash
# infra
docker-compose up -d postgres localstack

# cada serviço em um terminal
cd auth-service && npm run start:dev
cd tasks-service && npm run start:dev

# testes e2e
cd auth-service && npm run test:e2e
cd tasks-service && npm run test:e2e
```

**http://localhost:3002/board-wire**

##

Comunicação assíncrona entre os serviços e notificação em tempo real pro client

infra/localstack.Dockerfile + localstack-init.sh: LocalStack simulando SNS/SQS 
cria o tópico "user-events", a fila "user-events-tasks-queue" e a assinatura entre os dois

?? Empacotar o script dentro da imagem (em vez de bind mount) garante permissão de execução ??

??
O SqsConsumer roda num loop de fundo (polling), fora do ciclo de uma
request HTTP. O MikroORM por padrão bloqueia o uso do EntityManager
global fora desse ciclo pra evitar concorrência indevida entre requests
simultâneas.
??

auth-service
SnsPublisher (@aws-sdk/client-sns): publica "UserRegistered" depois de um registro bem-sucedido
AuthService injeta o publisher e chama ele no register()


tasks-service
SqsConsumer (@aws-sdk/client-sqs): long-polling na fila desde o boot e ao receber "UserRegistered", cria o board padrão pro usuário

mikro-orm.config.ts: allowGlobalContext: true: o consumer roda fora do ciclo de uma request HTTP, e o MikroORM bloqueia 
o EntityManager global nesse cenário por padrão


Antes: registrar um usuário só criava o usuário e tasks-service não sabia que ele existia
Agora: registro publica evento → tasks-service consome → board padrão criado sozinho, sem chamada HTTP


boardGateway (WebSocket, namespace /boards): sala por board (board:<id>), emite cardCreated cardMoved

boardsService chama ele depois de cada mutação

DevToolsController: rota GET /board-wire, serve uma página de teste (tools/board-wire.html) que conecta no gateway e mostra os eventos

Antes: criar/mover card só respondia pro cliente que fez a request
Agora: qualquer cliente com o board aberto via WebSocket recebe o update sem refresh

## Testes

e2e em test/*.e2e-spec.ts nos dois serviços. sem banco de teste isolado e-mails de teste usam timestamp.

describe/it/beforeAll/afterAll/expect são globais injetadas pelo Jest em
runtime, não vêm de import nenhum. por isso o tsconfig.spec.json precisa
de "types": ["jest", "node"] explícito (o TS 6 parou de auto-incluir
@types/* sozinho).

tsconfig.spec.json existe separado do tsconfig.json principal porque esse
último ganhou "exclude": ["test"] (senão o nest build da aplicação tentava
compilar os specs junto). O spec config libera rootDir e inclui test/ de
volta, só pra ele.

Jest roda em modo ESM (NODE_OPTIONS=--experimental-vm-modules,
useESM: true) — o @nestjs/common@12 e afins agora são ESM puro ("type":
"module", sem build CJS), e o Jest no modo padrão não consegue dar
require() nisso.

tasks-service/test/boards.e2e-spec.ts troca o SqsConsumer de verdade por um
stub (overrideProvider(SqsConsumer).useValue({ onModuleInit: () => {} })) —
o real entra num loop infinito de polling assim que a app sobe, e sem isso
o Jest nunca terminaria de rodar.

O mesmo arquivo assina um JWT de teste (jwt.sign(..., process.env.JWT_SECRET))
em vez de logar de verdade no auth-service. O tasks-service só valida token,
não emite, deixa os testes dele independentes.