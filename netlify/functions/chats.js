import { createClient } from '@supabase/supabase-js'

let supabase

const MAX_CONVERSAS = 80
const PAGE_SIZE = 1000

function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return supabase
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const client = getSupabase()

    // O Supabase devolve no máximo 1000 linhas por consulta e a tabela já passou
    // disso, então a aba mostra só as conversas mais recentes (o histórico
    // completo continua guardado no banco). Primeiro descobre quais telefones
    // falaram por último, depois busca o histórico inteiro só desses.
    const { data: recentRows, error: recentError } = await client
      .from('chat_messages')
      .select('phone')
      .order('id', { ascending: false })
      .limit(1000)
    if (recentError) throw recentError
    const recentPhones = [...new Set((recentRows || []).map((r) => r.phone))].slice(0, MAX_CONVERSAS)

    const data = []
    for (let from = 0; recentPhones.length > 0; from += PAGE_SIZE) {
      const { data: page, error } = await client
        .from('chat_messages')
        .select('phone, message')
        .in('phone', recentPhones)
        .order('phone', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)
      if (error) throw error
      data.push(...(page || []))
      if (!page || page.length < PAGE_SIZE) break
    }

    const [{ data: photoRows, error: photoError }, { data: syncRows, error: syncError }] = await Promise.all([
      client.from('chat_profile_photos').select('phone, photo_url'),
      // telefone -> negócio do Pipedrive (o front cruza com o funil da Laura pra achar o programa)
      client.from('pipedrive_conversa_sync').select('phone, deal_id'),
    ])
    if (photoError) throw photoError
    if (syncError) throw syncError

    const chats = {}
    for (const row of data || []) {
      const key = `chat-history_${row.phone}`
      if (!chats[key]) chats[key] = []
      chats[key].push(row.message)
    }

    const photos = {}
    for (const row of photoRows || []) {
      if (row.photo_url) photos[row.phone] = row.photo_url
    }

    const deals = {}
    for (const row of syncRows || []) {
      if (row.deal_id) deals[row.phone] = row.deal_id
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: Object.keys(chats).length, chats, photos, deals }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao consultar o histórico' }) }
  }
}
