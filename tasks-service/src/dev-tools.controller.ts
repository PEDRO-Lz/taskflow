import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { readFileSync } from 'fs'
import { join } from 'path'

// Serve a página de teste WebSocket
@Controller()
export class DevToolsController {
  @Get('board-wire')
  boardWire(@Res() res: Response) {
    const html = readFileSync(
      join(__dirname, '..', 'test', 'board-wire.html'),
      'utf-8',
    )
    res.type('html').send(html)
  }
}
