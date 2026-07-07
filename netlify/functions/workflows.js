export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const base = process.env.N8N_API_URL
    const apiKey = process.env.N8N_API_KEY
    if (!base || !apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'n8n não configurado' }) }
    }

    const res = await fetch(`${base}/api/v1/workflows?limit=250`, {
      headers: { 'X-N8N-API-KEY': apiKey },
    })
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Falha ao consultar o n8n' }) }
    }
    const json = await res.json()

    const workflows = (json.data || [])
      .filter((wf) => !wf.isArchived)
      .map((wf) => ({
        id: wf.id,
        name: wf.name,
        active: !!wf.active,
        tags: (wf.tags || []).map((t) => t.name),
        updatedAt: wf.updatedAt,
      }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflows }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao consultar fluxos do n8n' }) }
  }
}
