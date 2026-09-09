import { IoAdapter } from '@nestjs/platform-socket.io'
import { INestApplicationContext } from '@nestjs/common'
import { ServerOptions } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient, RedisClientType } from 'redis'

// Sem isso, cada réplica do tasks-service só enxerga os clients que
// conectaram nela mesma. Um cardCreated processado no pod A nunca
// chegaria em quem está conectado no pod B ou C. O Redis vira o canal de
// pub/sub compartilhado: todo emit vai publicado lá, e cada instância do
// socket.io assina o canal e retransmite pros seus próprios clients locais
export class RedisIoAdapter extends IoAdapter {
  private pubClient!: RedisClientType
  private subClient!: RedisClientType
  private adapterConstructor!: ReturnType<typeof createAdapter>

  constructor(app: INestApplicationContext) {
    super(app)
  }

  async connectToRedis(): Promise<void> {
    this.pubClient = createClient({ url: process.env.REDIS_URL })
    this.subClient = this.pubClient.duplicate()
    await Promise.all([this.pubClient.connect(), this.subClient.connect()])
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient)
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options)
    server.adapter(this.adapterConstructor)
    return server
  }
}
