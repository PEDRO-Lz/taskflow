### Para a build completa
```bash
docker-compose up --build
```

### Para rodar os services no host
```bash
# infra (postgres + localstack + terraform)
docker-compose up -d postgres localstack terraform

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

infra/terraform: LocalStack simulando SNS/SQS 
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

## Terraform

infra/terraform/ substitui o antigo script localstack-init.sh — os mesmos
recursos (tópico SNS, fila SQS, assinatura entre os dois) agora nascem
declarados em HCL em vez de comando awslocal. O provider aws aponta
pro LocalStack com a mesma credencial (access_key/secret_key)
que os serviços já usam, e os skip_* desligam a validação de conta AWS
provider tentaria fazer por padrão.

Rodar sozinho é automático agora: tem um serviço "terraform" no próprio
docker-compose.yml (imagem hashicorp/terraform), que roda init+apply e sai
— auth-service/tasks-service só sobem depois dele terminar com sucesso
(depends_on: condition: service_completed_successfully). Um docker-compose
up --build já faz tudo sozinho, sem passo manual nenhum.

O endpoint do LocalStack muda dependendo de onde o Terraform roda — dentro
do compose ele fala com o container "localstack" pelo nome (rede interna do
docker), no host fala com localhost. Isso é a variável
localstack_endpoint em variables.tf, passada via TF_VAR_localstack_endpoint
no compose. Mesmo padrão que os serviços Node já usam pro AWS_ENDPOINT.

Pra rodar/iterar na mão, sem o compose (útil enquanto edita o .tf):

cd infra/terraform
terraform init    # baixa o provider aws, só na primeira vez
terraform plan    # mostra o que vai mudar, sem aplicar nada
terraform apply   # cria de verdade — usa localhost:4566 por padrão

o script antigo não tinha aws_sqs_queue_policy. Sem
ela, numa AWS de verdade o SNS não teria permissão de publicar na fila (só
a subscription não basta).

o apply demora uns 50s na primeira vez (aws_sqs_queue e aws_sqs_queue_policy,
uns 25s cada) não é o LocalStack. é o próprio provider do Terraform que fica confirmando
de 5 em 5s antes de considerar criado.

## Kubernetes

infra/k8s/: a mesma stack do docker-compose, só que orquestrada por um
cluster local (kind) em vez do compose

postgres (compose) -> StatefulSet + PersistentVolumeClaim (precisa sempre
voltar pro mesmo disco, diferente de auth/tasks-service que não guardam
estado nenhum)
localstack, auth-service, tasks-service (compose) -> Deployment + Service
terraform (serviço do compose, roda e sai) -> Job, com um initContainer
esperando o localstack responder (Job não tem depends_on nativo)
environment: (compose) -> ConfigMap (o que não é segredo) + Secret (senha,
JWT_SECRET, credenciais AWS)

rodar:

kind create cluster --name taskflow
kind load docker-image taskflow-auth-service:latest taskflow-tasks-service:latest --name taskflow
kubectl apply -f infra/k8s/

as imagens precisam existir localmente antes (docker-compose build, ou
docker build direto). O kind não puxa do docker-compose sozinho, só
carrega o que já foi buildado.

pra testar (Service sozinho só é alcançável de dentro do cluster):

kubectl port-forward svc/auth-service 3001:3001
kubectl port-forward svc/tasks-service 3002:3002

terraform-configmap.yaml é gerado a partir dos .tf (kubectl create configmap --from-file)