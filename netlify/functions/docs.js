import Redis from 'ioredis'

const MAX_HTML_SIZE = 5 * 1024 * 1024 // 5MB
const INDEX_KEY = 'n8n_docs_index'
const contentKey = (workflowId) => `n8n_doc_content_${workflowId}`

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
  try {
    const client = getRedis()

    if (event.httpMethod === 'GET') {
      const workflowId = event.queryStringParameters?.workflowId
      if (workflowId) {
        const html = await client.get(contentKey(workflowId))
        if (html == null) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Documento não encontrado' }) }
        }
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html }),
        }
      }

      const index = await client.hgetall(INDEX_KEY)
      const docs = Object.entries(index)
        .map(([id, raw]) => {
          try { return { workflowId: id, ...JSON.parse(raw) } } catch { return null }
        })
        .filter(Boolean)

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs }),
      }
    }

    if (event.httpMethod === 'POST') {
      const { workflowId, title, html } = JSON.parse(event.body || '{}')
      if (!workflowId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'workflowId é obrigatório' }) }
      }
      if (!title || !title.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Título é obrigatório' }) }
      }
      if (!html || !html.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Conteúdo HTML é obrigatório' }) }
      }
      if (html.length > MAX_HTML_SIZE) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Arquivo muito grande (limite de 5MB)' }) }
      }

      const updatedAt = new Date().toISOString()
      const meta = { title: title.trim(), updatedAt, size: html.length }

      await client.set(contentKey(workflowId), html)
      await client.hset(INDEX_KEY, workflowId, JSON.stringify(meta))

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, ...meta }),
      }
    }

    if (event.httpMethod === 'DELETE') {
      const workflowId = event.queryStringParameters?.workflowId
      if (!workflowId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'workflowId é obrigatório' }) }
      }
      await client.del(contentKey(workflowId))
      await client.hdel(INDEX_KEY, workflowId)
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao acessar os documentos' }) }
  }
}
