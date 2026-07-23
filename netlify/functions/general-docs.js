import { createClient } from '@supabase/supabase-js'

const MAX_HTML_SIZE = 5 * 1024 * 1024 // 5MB
const TABLE = 'general_docs'

let supabase

function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return supabase
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

function toDoc(row) {
  return { slug: row.slug, title: row.title, updatedAt: row.updated_at, size: row.size, protected: row.protected }
}

export const handler = async (event) => {
  try {
    const client = getSupabase()

    if (event.httpMethod === 'GET') {
      const slug = event.queryStringParameters?.slug
      if (slug) {
        const { data, error } = await client.from(TABLE).select('html').eq('slug', slug).maybeSingle()
        if (error) throw error
        if (!data) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Documento não encontrado' }) }
        }
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: data.html }),
        }
      }

      const { data, error } = await client
        .from(TABLE)
        .select('slug, title, updated_at, size, protected')
        .order('updated_at', { ascending: false })
      if (error) throw error

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: (data || []).map(toDoc) }),
      }
    }

    if (event.httpMethod === 'POST') {
      const { title, html, protected: isProtected, slug: targetSlug } = JSON.parse(event.body || '{}')
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
      let slug = targetSlug

      if (!slug) {
        // upload novo — gera slug a partir do título, evitando colisão com documento de título diferente
        slug = slugify(trimmedTitle)
        const { data: existing } = await client.from(TABLE).select('title').eq('slug', slug).maybeSingle()
        if (existing && existing.title !== trimmedTitle) {
          slug = `${slug}-${Date.now().toString(36)}`
        }
      }
      // se targetSlug foi enviado, é uma substituição explícita — atualiza sempre o mesmo slug,
      // mesmo que o título tenha mudado

      const updatedAt = new Date().toISOString()
      const row = { slug, title: trimmedTitle, html, updated_at: updatedAt, size: html.length, protected: !!isProtected }

      const { error } = await client.from(TABLE).upsert(row, { onConflict: 'slug' })
      if (error) throw error

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title: trimmedTitle, updatedAt, size: html.length, protected: !!isProtected }),
      }
    }

    if (event.httpMethod === 'DELETE') {
      const slug = event.queryStringParameters?.slug
      if (!slug) {
        return { statusCode: 400, body: JSON.stringify({ error: 'slug é obrigatório' }) }
      }
      const { data: existing } = await client.from(TABLE).select('protected').eq('slug', slug).maybeSingle()
      if (existing?.protected) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Documento protegido — não pode ser apagado' }) }
      }
      const { error } = await client.from(TABLE).delete().eq('slug', slug)
      if (error) throw error
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao acessar os documentos' }) }
  }
}
