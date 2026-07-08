import Redis from 'ioredis'

const MAX_HTML_SIZE = 5 * 1024 * 1024 // 5MB
const INDEX_KEY = 'general_docs_index'
const contentKey = (slug) => `general_doc_content_${slug}`

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

function slugify(title) {
  const base = title
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
  return base || 'documento'
}

export const handler = async (event) => {
  try {
    const client = getRedis()

    if (event.httpMethod === 'GET') {
      const slug = event.queryStringParameters?.slug
      if (slug) {
        const html = await client.get(contentKey(slug))
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
        .map(([docSlug, raw]) => {
          try { return { slug: docSlug, ...JSON.parse(raw) } } catch { return null }
        })
        .filter(Boolean)
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs }),
      }
    }

    if (event.httpMethod === 'POST') {
      const { title, html } = JSON.parse(event.body || '{}')
      if (!title || !title.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Título é obrigatório' }) }
      }
      if (!html || !html.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Conteúdo HTML é obrigatório' }) }
      }
      if (html.length > MAX_HTML_SIZE) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Arquivo muito grande (limite de 5MB)' }) }
      }

      const trimmedTitle = title.trim()
      let slug = slugify(trimmedTitle)
      const existingRaw = await client.hget(INDEX_KEY, slug)
      if (existingRaw) {
        let sameTitle = false
        try { sameTitle = JSON.parse(existingRaw).title === trimmedTitle } catch { /* mantém sameTitle = false */ }
        if (!sameTitle) slug = `${slug}-${Date.now().toString(36)}`
      }

      const updatedAt = new Date().toISOString()
      const meta = { title: trimmedTitle, updatedAt, size: html.length }

      await client.set(contentKey(slug), html)
      await client.hset(INDEX_KEY, slug, JSON.stringify(meta))

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...meta }),
      }
    }

    if (event.httpMethod === 'DELETE') {
      const slug = event.queryStringParameters?.slug
      if (!slug) {
        return { statusCode: 400, body: JSON.stringify({ error: 'slug é obrigatório' }) }
      }
      await client.del(contentKey(slug))
      await client.hdel(INDEX_KEY, slug)
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao acessar os documentos' }) }
  }
}
