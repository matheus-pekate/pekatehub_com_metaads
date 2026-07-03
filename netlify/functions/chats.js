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

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: keys.length, chats: result }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao consultar Redis' }) }
  }
}
