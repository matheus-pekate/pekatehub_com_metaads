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

// Situação atual de cada negócio no Pipedrive (aberto / ganho / perdido + motivo da
// perda). Consulta em lotes de 100 ids (limite da API v2) e guarda o resultado por
// 60s pra o recarregamento automático da aba não bater no Pipedrive a cada minuto.
// Se o token não estiver configurado ou o Pipedrive falhar, a aba segue funcionando
// só que sem a etiqueta de situação (nunca derruba as conversas).
const DEAL_BATCH = 100
const DEAL_CACHE_MS = 60 * 1000
const dealCache = new Map() // deal_id -> { at, info }

async function fetchDealInfo(dealIds) {
  const token = process.env.PIPEDRIVE_API_TOKEN || process.env.VITE_PIPEDRIVE_TOKEN
  if (!token || dealIds.length === 0) return {}

  const now = Date.now()
  const info = {}
  const missing = []
  for (const id of dealIds) {
    const cached = dealCache.get(id)
    if (cached && now - cached.at < DEAL_CACHE_MS) info[id] = cached.info
    else missing.push(id)
  }

  for (let i = 0; i < missing.length; i += DEAL_BATCH) {
    const batch = missing.slice(i, i + DEAL_BATCH)
    try {
      const res = await fetch(`https://api.pipedrive.com/api/v2/deals?ids=${batch.join(',')}&limit=${DEAL_BATCH}`, {
        headers: { 'x-api-token': token },
      })
      if (!res.ok) throw new Error(`Pipedrive respondeu ${res.status}`)
      const json = await res.json()
      for (const deal of json.data || []) {
        const entry = {
          status: deal.status,
          lost_reason: deal.lost_reason || null,
          lost_time: deal.lost_time || null,
          won_time: deal.won_time || null,
        }
        info[String(deal.id)] = entry
        dealCache.set(String(deal.id), { at: now, info: entry })
      }
    } catch (err) {
      console.error('Falha ao consultar negócios no Pipedrive:', err.message)
    }
  }
  return info
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

    // só os negócios das conversas exibidas (no máx. 80)
    const shownDealIds = [...new Set(recentPhones.map((phone) => deals[phone]).filter(Boolean).map(String))]
    const dealInfo = await fetchDealInfo(shownDealIds)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: Object.keys(chats).length, chats, photos, deals, dealInfo }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao consultar o histórico' }) }
  }
}
