import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { BoardsService } from './boards.service'
import { CreateBoardDto } from './dto/create-board.dto'
import { AddCardDto } from './dto/add-card.dto'
import { MoveCardDto } from './dto/move-card.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Post()
  create(@Body() dto: CreateBoardDto) {
    return this.boards.createBoard(dto)
  }

  @Post(':boardId/cards')
  addCard(@Param('boardId') boardId: string, @Body() dto: AddCardDto) {
    return this.boards.addCard(boardId, dto)
  }

  @Patch(':boardId/cards/:cardId')
  moveCard(
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.boards.moveCard(boardId, cardId, dto.status)
  }
}
