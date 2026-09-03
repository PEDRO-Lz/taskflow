## Comandos

```bash
docker-compose up --build
```

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