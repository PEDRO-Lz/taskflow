import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/postgresql'
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs'
import { Board } from './board.entity'

// Faz polling na fila SQS e reage aos eventos publicados pelo auth-service
// TODO: worker separado
@Injectable()
export class SqsConsumer implements OnModuleInit {
  private readonly logger = new Logger(SqsConsumer.name)
  private readonly client = new SQSClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
  })

  constructor(
    @InjectRepository(Board) private readonly boards: EntityRepository<Board>,
  ) {}

  onModuleInit() {
    this.poll()
  }

  private async poll() {
    while (true) {
      try {
        const result = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: process.env.SQS_QUEUE_URL,
            WaitTimeSeconds: 10, // long polling
            MaxNumberOfMessages: 5,
          }),
        )

        for (const message of result.Messages ?? []) {
          await this.handleMessage(message.Body!)

          await this.client.send(
            new DeleteMessageCommand({
              QueueUrl: process.env.SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            }),
          )
        }
      } catch (err) {
        this.logger.error('Erro consumindo a fila SQS', err as Error)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
  }

  private async handleMessage(rawBody: string) {
    const envelope = JSON.parse(rawBody)
    const event = JSON.parse(envelope.Message ?? rawBody)

    if (event.eventType === 'UserRegistered') {
      this.boards.create({
        title: 'Meu primeiro board',
        ownerId: event.userId,
      })
      await this.boards.getEntityManager().flush()
      this.logger.log(`Board padrão criado para o usuário ${event.userId}`)
    }
  }
}
