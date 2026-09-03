import { Injectable, Logger } from '@nestjs/common'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

// Publica eventos de domínio no SNS
@Injectable()
export class SnsPublisher {
  private readonly logger = new Logger(SnsPublisher.name)
  private readonly client = new SNSClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
  })

  async publishUserRegistered(userId: string, email: string): Promise<void> {
    const message = JSON.stringify({
      eventType: 'UserRegistered',
      userId,
      email,
      occurredAt: new Date().toISOString(),
    })

    await this.client.send(
      new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: message,
      }),
    )

    this.logger.log(`Evento UserRegistered publicado para ${userId}`)
  }
}
