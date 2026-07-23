import { createClient } from '@supabase/supabase-js'

let supabase

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
    const { data, error } = await client
      .from('chat_messages')
      .select('phone, message')
      .order('phone', { ascending: true })
      .order('id', { ascending: true })
    if (error) throw error

    const chats = {}
    for (const row of data || []) {
      const key = `chat-history_${row.phone}`
      if (!chats[key]) chats[key] = []
      chats[key].push(row.message)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: Object.keys(chats).length, chats }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao consultar o histórico' }) }
  }
}
