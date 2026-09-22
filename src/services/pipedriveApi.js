import { PIPEDRIVE_BASE_URL } from '../config/pipedrive.js'

// Funciona tanto no browser (Vite injeta import.meta.env no build do cliente)
// quanto em Netlify Functions (Node puro, onde import.meta.env não existe —
// cai pro process.env, que a Netlify já preenche com as mesmas env vars do
// site, incluindo as VITE_*) — permite reusar este arquivo inteiro nos dois
// lados sem duplicar as chamadas à API do Pipedrive.
const TOKEN = import.meta.env?.VITE_PIPEDRIVE_TOKEN || (typeof process !== 'undefined' ? process.env.VITE_PIPEDRIVE_TOKEN : undefined)

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

// Busca todos os deals de um pipeline com paginação por cursor (API v2).
// include_fields traz next_activity_id/last_activity_id direto no deal —
// só existe na v2 (a v1 não tem esse parâmetro), por isso essa busca não
// pode ser trocada por /api/v1/deals.
export async function fetchAllDealsByPipeline(pipelineId) {
  const allDeals = []
  let cursor = null
  const MAX_PAGES = 50 // trava de segurança — 50×500 = 25.000 deals, bem acima do real

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v2/deals`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('pipeline_id', pipelineId)
    url.searchParams.set('include_fields', 'next_activity_id,last_activity_id')
    url.searchParams.set('limit', 500)
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Erro ao buscar deals do pipeline ${pipelineId}: ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error(`Pipedrive API retornou success=false ao buscar deals do pipeline ${pipelineId}`)

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
// `done`: 1 = só concluídas (padrão — usado pra métricas de volume de
// contato já realizado), 0 = só pendentes, null = as duas (usado pra metas
// do tipo "agendado", onde o que importa é ter marcado a atividade, não se
// ela já aconteceu).
async function fetchActivitiesInDateRange(userId, startDate, endDate, { done = 1 } = {}) {
  const all = []
  let start = 0
  while (true) {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v1/activities`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('user_id', userId)
    url.searchParams.set('start_date', startDate)
    if (endDate) url.searchParams.set('end_date', endDate)
    if (done !== null) url.searchParams.set('done', done)
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
export async function fetchUserActivities(userId, sinceDays = 7, opts) {
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)
  return fetchActivitiesInDateRange(userId, since.toISOString().slice(0, 10), null, opts)
}

// Busca atividades de um usuário num intervalo fixo — usado pelo modo
// "ano-calendário" (ex.: Comando B2B), onde o período não é relativo a hoje.
export async function fetchUserActivitiesInRange(userId, startDate, endDate, opts) {
  return fetchActivitiesInDateRange(userId, startDate, endDate, opts)
}

// Busca metas configuradas no Pipedrive (Goals API). Esse serviço usa o
// prefixo `/v1/` sem o `/api/` — diferente do resto da API v1 do Pipedrive
// (peculiaridade confirmada testando o endpoint: `/api/v1/goals/find` dá
// 404, só `/v1/goals/find` funciona).
export async function fetchGoals() {
  const url = new URL(`${PIPEDRIVE_BASE_URL}/v1/goals/find`)
  url.searchParams.set('api_token', TOKEN)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Pipedrive API error: ${res.status} on /v1/goals/find`)
  const json = await res.json()
  if (!json.success) throw new Error('Pipedrive API returned success=false on /v1/goals/find')
  return json.data
}

// Busca due_date/marked_as_done_time de um conjunto de atividades pelos ids
// (até 100 por chamada, por isso faz em lotes — todos em paralelo, já que
// são chamadas independentes). O filtro por "ids" só existe na API v2
// (/api/v2/activities) — a v1 não aceita esse parâmetro.
export async function fetchActivitiesByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  const chunks = []
  for (let i = 0; i < unique.length; i += 100) chunks.push(unique.slice(i, i + 100))

  const results = await Promise.all(chunks.map(async (chunk) => {
    const url = new URL(`${PIPEDRIVE_BASE_URL}/api/v2/activities`)
    url.searchParams.set('api_token', TOKEN)
    url.searchParams.set('ids', chunk.join(','))
    url.searchParams.set('limit', 100)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Erro ao buscar atividades por id: ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error('Pipedrive API retornou success=false ao buscar atividades por id')
    return json.data || []
  }))

  const byId = {}
  results.flat().forEach((a) => { byId[a.id] = a })
  return byId
}
