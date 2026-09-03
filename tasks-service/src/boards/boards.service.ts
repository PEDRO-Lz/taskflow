import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/postgresql'
import { Board } from './board.entity'
import { Card, CardStatus } from './card.entity'
import { CreateBoardDto } from './dto/create-board.dto'
import { AddCardDto } from './dto/add-card.dto'
import { BoardGateway } from './board.gateway'

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boards: EntityRepository<Board>,
    @InjectRepository(Card) private readonly cards: EntityRepository<Card>,
    private readonly gateway: BoardGateway,
  ) {}

  async createBoard(dto: CreateBoardDto) {
    const board = this.boards.create({ title: dto.title, ownerId: dto.ownerId })
    await this.boards.getEntityManager().flush()
    return board
  }

  async addCard(boardId: string, dto: AddCardDto) {
    const board = await this.getBoardOrFail(boardId)
    const card = this.cards.create({ title: dto.title, board })
    await this.cards.getEntityManager().flush()

    // Card atualiza
    this.gateway.emitCardCreated(boardId, {
      id: card.id,
      title: card.title,
      status: card.status,
    })

    return card
  }

  async moveCard(boardId: string, cardId: string, status: CardStatus) {
    await this.getBoardOrFail(boardId)

    const card = await this.cards.findOne({ id: cardId, board: boardId })
    if (!card) {
      throw new NotFoundException('Card não encontrado neste board.')
    }

    card.status = status
    await this.cards.getEntityManager().flush()

    this.gateway.emitCardMoved(boardId, cardId, status)

    return card
  }

  private async getBoardOrFail(id: string): Promise<Board> {
    const board = await this.boards.findOne({ id })
    if (!board) {
      throw new NotFoundException('Board não encontrado.')
    }
    return board
  }
}
