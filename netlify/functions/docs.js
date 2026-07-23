import { createClient } from '@supabase/supabase-js'

const MAX_HTML_SIZE = 5 * 1024 * 1024 // 5MB
const TABLE = 'n8n_docs'

let supabase

function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return supabase
}

function toDoc(row) {
  return { workflowId: row.workflow_id, title: row.title, updatedAt: row.updated_at, size: row.size }
}

export const handler = async (event) => {
  try {
    const client = getSupabase()

    if (event.httpMethod === 'GET') {
      const workflowId = event.queryStringParameters?.workflowId
      if (workflowId) {
        const { data, error } = await client.from(TABLE).select('html').eq('workflow_id', workflowId).maybeSingle()
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

      const { data, error } = await client.from(TABLE).select('workflow_id, title, updated_at, size')
      if (error) throw error

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: (data || []).map(toDoc) }),
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
      const row = { workflow_id: workflowId, title: title.trim(), html, updated_at: updatedAt, size: html.length }

      const { error } = await client.from(TABLE).upsert(row, { onConflict: 'workflow_id' })
      if (error) throw error

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, title: title.trim(), updatedAt, size: html.length }),
      }
    }

    if (event.httpMethod === 'DELETE') {
      const workflowId = event.queryStringParameters?.workflowId
      if (!workflowId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'workflowId é obrigatório' }) }
      }
      const { error } = await client.from(TABLE).delete().eq('workflow_id', workflowId)
      if (error) throw error
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao acessar os documentos' }) }
  }
}
