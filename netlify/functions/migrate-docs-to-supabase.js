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
    const result = { generalDocs: 0, n8nDocs: 0 }

    const generalIndex = await client.hgetall('general_docs_index')
    for (const [slug, raw] of Object.entries(generalIndex)) {
      const meta = JSON.parse(raw)
      const html = await client.get(`general_doc_content_${slug}`)
      if (html == null) continue
      const { error } = await supabase.from('general_docs').upsert({
        slug,
        title: meta.title,
        html,
        updated_at: meta.updatedAt,
        size: meta.size ?? html.length,
        protected: !!meta.protected,
      }, { onConflict: 'slug' })
      if (error) throw error
      result.generalDocs++
    }

    const n8nIndex = await client.hgetall('n8n_docs_index')
    for (const [workflowId, raw] of Object.entries(n8nIndex)) {
      const meta = JSON.parse(raw)
      const html = await client.get(`n8n_doc_content_${workflowId}`)
      if (html == null) continue
      const { error } = await supabase.from('n8n_docs').upsert({
        workflow_id: workflowId,
        title: meta.title,
        html,
        updated_at: meta.updatedAt,
        size: meta.size ?? html.length,
      }, { onConflict: 'workflow_id' })
      if (error) throw error
      result.n8nDocs++
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
