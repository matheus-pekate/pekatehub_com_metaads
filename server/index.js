import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Redis from 'ioredis'

const app = express()
app.use(cors())
const port = process.env.PORT || 3001

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
})

redis.on('error', (err) => console.error('Redis error:', err))

// GET /api/chats — retorna todas as listas com prefixo chat-history_
app.get('/api/chats', async (req, res) => {
  try {
    const keys = []
    let cursor = '0'

    do {
      const [nextCursor, found] = await redis.scan(cursor, 'MATCH', 'chat-history_*', 'COUNT', 100)
      cursor = nextCursor
      keys.push(...found)
    } while (cursor !== '0')

    const result = {}
    await Promise.all(
      keys.map(async (key) => {
        const messages = await redis.lrange(key, 0, -1)
        result[key] = messages.map((m) => {
          try { return JSON.parse(m) } catch { return m }
        })
      })
    )

    res.json({ total: keys.length, chats: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao consultar Redis' })
  }
})

app.listen(port, () => console.log(`API rodando em http://localhost:${port}`))
