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

// Busca atividades "done" de um usuário num intervalo [startDate, endDate)
// (formato YYYY-MM-DD) — pagina por `start`/`next_start`, pois vendedores com
// maior volume passam de 500 atividades em janelas mais largas (ex.: 180+
// dias / ano inteiro) e a API limita a resposta a 500 itens por página.
async function fetchActivitiesInDateRange(userId, startDate, endDate) {
  const all = []
  let start = 0
  while (true) {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v1/activities`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('user_id', userId)
    url.searchParams.set('start_date', startDate)
    if (endDate) url.searchParams.set('end_date', endDate)
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

// Busca atividades recentes (últimos N dias, contados de hoje) de um usuário.
export async function fetchUserActivities(userId, sinceDays = 7) {
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)
  return fetchActivitiesInDateRange(userId, since.toISOString().slice(0, 10), null)
}

// Busca atividades de um usuário num intervalo fixo — usado pelo modo
// "ano-calendário" (ex.: Comando B2B), onde o período não é relativo a hoje.
export async function fetchUserActivitiesInRange(userId, startDate, endDate) {
  return fetchActivitiesInDateRange(userId, startDate, endDate)
}

// Busca, pra todo deal aberto de um pipeline, o id da próxima atividade
// agendada (ainda não feita) e o id da última atividade de fato concluída.
// Só a API v1 (via include_fields) expõe esses dois campos — a v2 usada em
// fetchAllDealsByPipeline não tem equivalente, por isso é uma chamada extra
// e não substitui a busca principal de deals.
export async function fetchDealActivitySignals(pipelineId) {
  const signals = {}
  let start = 0
  while (true) {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v1/deals`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('pipeline_id', pipelineId)
    url.searchParams.set('status', 'open')
    url.searchParams.set('include_fields', 'next_activity_id,last_activity_id')
    url.searchParams.set('limit', 500)
    url.searchParams.set('start', start)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Erro ao buscar sinais de atividade do pipeline ${pipelineId}: ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error(`Pipedrive API retornou success=false ao buscar sinais de atividade do pipeline ${pipelineId}`)

    ;(json.data || []).forEach((d) => {
      signals[d.id] = { nextActivityId: d.next_activity_id || null, lastActivityId: d.last_activity_id || null }
    })

    const pagination = json.additional_data?.pagination
    if (!pagination?.more_items_in_collection || pagination.next_start == null) break
    start = pagination.next_start
  }
  return signals
}

// Busca due_date/marked_as_done_time de um conjunto de atividades pelos ids
// (até 100 por chamada, por isso faz em lotes).
export async function fetchActivitiesByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  const byId = {}
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100)
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v1/activities`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('ids', chunk.join(','))
    url.searchParams.set('limit', 100)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Erro ao buscar atividades por id: ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error('Pipedrive API retornou success=false ao buscar atividades por id')

    ;(json.data || []).forEach((a) => { byId[a.id] = a })
  }
  return byId
}
