import { Module } from '@nestjs/common'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Board } from './board.entity'
import { Card } from './card.entity'
import { BoardsService } from './boards.service'
import { BoardsController } from './boards.controller'
import { AuthModule } from '../auth/auth.module'
import { SqsConsumer } from './sqs-consumer.service'

@Module({
  imports: [MikroOrmModule.forFeature([Board, Card]), AuthModule],
  controllers: [BoardsController],
  providers: [BoardsService, SqsConsumer],
})
export class BoardsModule {}
