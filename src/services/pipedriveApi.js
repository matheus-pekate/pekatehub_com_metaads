import { PIPEDRIVE_BASE_URL } from '../config/pipedrive.js'

const TOKEN = import.meta.env.VITE_PIPEDRIVE_TOKEN

// Utilitário base de fetch
async function pipedriveGet(path, params = {}) {
  const url = new URL(`${PIPEDRIVE_BASE_URL}${path}`)
  url.searchParams.set('api_token', TOKEN)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Pipedrive API error: ${res.status} on ${path}`)
  const json = await res.json()
  if (!json.success) throw new Error(`Pipedrive API returned success=false on ${path}`)
  return json.data
}

// Busca todos os deals de um pipeline com paginação por cursor (API v2)
export async function fetchAllDealsByPipeline(pipelineId) {
  const allDeals = []
  let cursor = null

  while (true) {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v2/deals`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('pipeline_id', pipelineId)
    url.searchParams.set('limit', 500)
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Erro ao buscar deals do pipeline ${pipelineId}: ${res.status}`)
    const json = await res.json()

    const deals = json.data || []
    allDeals.push(...deals)

    cursor = json.additional_data?.next_cursor ?? null
    if (!cursor) break
  }

  return allDeals
}

// Busca lista de usuários (vendedores)
export async function fetchUsers() {
  return pipedriveGet('/api/v1/users')
}

// Busca resumo agregado de deals de um pipeline
export async function fetchDealsSummary(pipelineId) {
  return pipedriveGet('/api/v1/deals/summary', { pipeline_id: pipelineId })
}

// Busca detalhe de um deal (API v1 — inclui stay_in_pipeline_stages)
export async function fetchDealDetails(dealId) {
  return pipedriveGet(`/api/v1/deals/${dealId}`)
}

// Busca atividades recentes (últimos N dias) de um usuário — pagina por
// `start`/`next_start`, pois vendedores com maior volume passam de 500
// atividades em janelas mais largas (ex.: 180+ dias) e a API limita a
// resposta a 500 itens por página.
export async function fetchUserActivities(userId, sinceDays = 7) {
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)
  const sinceStr = since.toISOString().slice(0, 10)

  const all = []
  let start = 0
  while (true) {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v1/activities`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('user_id', userId)
    url.searchParams.set('start_date', sinceStr)
    url.searchParams.set('done', 1)
    url.searchParams.set('limit', 500)
    url.searchParams.set('start', start)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Pipedrive API error: ${res.status} on /api/v1/activities`)
    const json = await res.json()
    if (!json.success) throw new Error('Pipedrive API returned success=false on /api/v1/activities')

    all.push(...(json.data || []))
    const pagination = json.additional_data?.pagination
    if (!pagination?.more_items_in_collection || pagination.next_start == null) break
    start = pagination.next_start
  }
  return all
}
