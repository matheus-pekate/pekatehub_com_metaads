import Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'

let redis
function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
    })
  }
  return redis
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export const handler = async () => {
  try {
    const client = getRedis()
    const keys = []
    let cursor = '0'
    do {
      const [nextCursor, found] = await client.scan(cursor, 'MATCH', 'chat-history_*', 'COUNT', 100)
      cursor = nextCursor
      keys.push(...found)
    } while (cursor !== '0')

    let totalMessages = 0
    let totalSkipped = 0
    for (const key of keys) {
      const phone = key.replace('chat-history_', '')
      const messages = await client.lrange(key, 0, -1)
      if (messages.length === 0) continue

      const { data: existing, error: fetchError } = await supabase
        .from('chat_messages')
        .select('message')
        .eq('phone', phone)
      if (fetchError) throw fetchError
      const existingSet = new Set((existing || []).map((r) => r.message))

      const rows = messages.filter((message) => !existingSet.has(message)).map((message) => ({ phone, message }))
      totalSkipped += messages.length - rows.length
      if (rows.length === 0) continue

      const { error } = await supabase.from('chat_messages').insert(rows)
      if (error) throw error
      totalMessages += rows.length
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPhones: keys.length, totalMessages, totalSkipped }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
