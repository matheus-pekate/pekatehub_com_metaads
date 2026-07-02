import Redis from 'ioredis'

let redis

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
    })
    redis.on('error', (err) => console.error('Redis error:', err))
  }
  return redis
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const client = getRedis()
    const keys = []
    let cursor = '0'

    do {
      const [nextCursor, found] = await client.scan(cursor, 'MATCH', 'chat-history_*', 'COUNT', 100)
      cursor = nextCursor
      keys.push(...found)
    } while (cursor !== '0')

    const result = {}
    await Promise.all(
      keys.map(async (key) => {
        const messages = await client.lrange(key, 0, -1)
        result[key] = messages.map((m) => {
          try { return JSON.parse(m) } catch { return m }
        })
      })
    )

    res.status(200).json({ total: keys.length, chats: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao consultar Redis' })
  }
}
