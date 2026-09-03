import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

// Board = sala do socket.io
@WebSocketGateway({ namespace: 'boards', cors: { origin: '*' } })
export class BoardGateway {
  @WebSocketServer()
  server!: Server

  @SubscribeMessage('joinBoard')
  onJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() boardId: string,
  ) {
    client.join(`board:${boardId}`)
  }

  // Chamados pelo BoardsService sempre que um card muda
  emitCardCreated(
    boardId: string,
    card: { id: string; title: string; status: string },
  ) {
    this.server.to(`board:${boardId}`).emit('cardCreated', card)
  }

  emitCardMoved(boardId: string, cardId: string, status: string) {
    this.server.to(`board:${boardId}`).emit('cardMoved', { cardId, status })
  }
}
