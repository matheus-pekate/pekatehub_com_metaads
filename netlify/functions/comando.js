// Expõe os números dos painéis Comando B2C (src/pages/PekateDash.jsx) e
// Comando B2B (src/pages/PekateB2BDash.jsx) em JSON, pra um agente do n8n
// consultar sob demanda — reusa a mesma lógica de cálculo dos dashboards
// (processProgramDeals / processB2BProgram), então nunca fica dessincronizado.
//
// GET /api/comando?segment=ambos|b2c|b2b&year=2026 (year só vale pro B2B; default = ano atual)
//
// Se a env var METAS_API_SECRET estiver configurada na Netlify, a chamada
// precisa do header `x-metas-secret` com o mesmo valor — sem essa env var,
// o endpoint fica aberto (mesma postura dos outros endpoints deste hub).
import { fetchAllDealsByPipeline, fetchUsers, fetchActivitiesByIds } from '../../src/services/pipedriveApi.js'
import { PROGRAMS, PROGRAMS_B2B } from '../../src/config/pipedrive.js'
import { processProgramDeals } from '../../src/hooks/useDashboardData.js'
import { processB2BProgram, getPeriodRange } from '../../src/hooks/useB2BDashboardData.js'

const ALERT_DEAL_LIMIT = 5

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

// Mantém contagem/texto/marco de cada alerta, mas corta a lista de deals
// pros N mais urgentes — a lista completa é o que a UI usa pro modal, aqui
// só interessa dar ao agente uma amostra pra citar exemplos concretos.
function trimAlerts(alerts) {
  const trim = (bucket) => ({ count: bucket.count, text: bucket.text, topDeals: (bucket.deals || []).slice(0, ALERT_DEAL_LIMIT) })
  return {
    critico: trim(alerts.critico),
    pendencia: trim(alerts.pendencia),
    oportunidade: trim(alerts.oportunidade),
    marco: alerts.marco,
  }
}

function trimSellers(sellers) {
  return (sellers || []).map(({ id, name, converted, convertedValue, active, lastActivity }) => ({
    id, name, converted, convertedValue, active, lastActivity,
  }))
}

function summarizeB2CProgram(p) {
  const daysTxt = p.marcoText ? ` · ${p.marcoText}` : ''
  return `${p.shortName} — ${p.converted}/${p.dynamicGoal} matriculados (${p.goalPercent}% da meta) · ` +
    `${formatBRL(p.totalWonValue)} arrecadado · ${p.totalActive} leads ativos · ` +
    `${p.alerts.critico.count} críticos, ${p.alerts.oportunidade.count} prontos pra fechar${daysTxt}`
}

function summarizeB2BProgram(p, year) {
  return `${p.shortName} (${year}) — ${p.wonCount} negócios ganhos, ${formatBRL(p.totalWonValue)} ` +
    `(${p.goalPercent}% da meta anual de ${formatBRL(p.periodRevenueGoal)}) · ${p.totalOpenCount} negócios abertos ` +
    `(${formatBRL(p.totalOpenValue)} em pipeline) · ${p.alerts.critico.count} críticos, ${p.alerts.oportunidade.count} prontos pra fechar`
}

async function loadB2C() {
  const [programDealsResults, users] = await Promise.all([
    Promise.all(PROGRAMS.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
    fetchUsers(),
  ])

  const userMap = {}
  ;(users || []).forEach((u) => { userMap[u.id] = { name: u.name } })

  const allActivityIds = new Set()
  programDealsResults.forEach((deals) => {
    deals.filter((d) => d.status === 'open').forEach((deal) => {
      if (deal.next_activity_id) allActivityIds.add(deal.next_activity_id)
      if (deal.last_activity_id) allActivityIds.add(deal.last_activity_id)
    })
  })
  const activitiesById = allActivityIds.size > 0
    ? await fetchActivitiesByIds([...allActivityIds]).catch(() => ({}))
    : {}

  const programs = PROGRAMS.map((program, idx) => {
    const deals = programDealsResults[idx]
    const m = processProgramDeals(program, deals, userMap, activitiesById)
    const p = {
      id: program.id,
      name: program.name,
      shortName: program.shortName,
      startDate: program.startDate,
      goal: program.goal,
      dynamicGoal: m.dynamicGoal,
      revenueGoal: program.revenueGoal,
      converted: m.converted,
      totalWonValue: m.totalWonValue,
      avgTicket: Math.round(m.avgTicket),
      totalActive: m.totalActive,
      forecast: Math.round(m.forecast),
      conversionRate: Math.round(m.conversionRate * 10) / 10,
      goalPercent: m.goalPercent,
      marcoText: m.alerts.marco.text,
      alerts: trimAlerts(m.alerts),
      sellers: trimSellers(m.sellers),
    }
    return { ...p, summary: summarizeB2CProgram(p) }
  })

  return { programs }
}

async function loadB2B(year) {
  const [dealsByPipeline, users] = await Promise.all([
    Promise.all(PROGRAMS_B2B.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
    fetchUsers(),
  ])

  const userMap = {}
  ;(users || []).forEach((u) => { userMap[u.id] = { name: u.name } })

  const range = getPeriodRange(year)
  const programs = PROGRAMS_B2B.map((program, idx) => {
    const deals = dealsByPipeline[idx]
    const m = processB2BProgram(program, deals, range, userMap)
    const p = {
      id: program.id,
      name: program.name,
      shortName: program.shortName,
      goal: program.goal ?? null,
      revenueGoal: program.revenueGoal,
      periodRevenueGoal: m.periodRevenueGoal,
      wonCount: m.wonCount,
      totalWonValue: m.totalWonValue,
      avgTicket: Math.round(m.avgTicket),
      totalOpenCount: m.totalOpenCount,
      totalOpenValue: m.totalOpenValue,
      forecastValue: Math.round(m.forecastValue),
      forecastCount: m.forecastCount,
      conversionRate: Math.round(m.conversionRate * 10) / 10,
      goalPercent: Math.round(m.goalPercent),
      remaining: Math.round(m.remaining),
      alerts: trimAlerts(m.alerts),
      sellers: trimSellers(m.sellers),
    }
    return { ...p, summary: summarizeB2BProgram(p, year) }
  })

  return { year, programs }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const requiredSecret = process.env.METAS_API_SECRET
  if (requiredSecret) {
    const provided = event.headers['x-metas-secret'] || event.headers['X-Metas-Secret']
    if (provided !== requiredSecret) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Não autorizado' }) }
    }
  }

  const segmentParam = (event.queryStringParameters?.segment || 'ambos').toLowerCase()
  const wantB2C = segmentParam === 'ambos' || segmentParam === 'b2c'
  const wantB2B = segmentParam === 'ambos' || segmentParam === 'b2b'
  if (!wantB2C && !wantB2B) {
    return { statusCode: 400, body: JSON.stringify({ error: 'segment deve ser "ambos", "b2c" ou "b2b"' }) }
  }

  const yearParam = Number(event.queryStringParameters?.year)
  const year = Number.isInteger(yearParam) ? yearParam : new Date().getFullYear()

  try {
    const [b2c, b2b] = await Promise.all([
      wantB2C ? loadB2C() : null,
      wantB2B ? loadB2B(year) : null,
    ])

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedAt: new Date().toISOString(),
        ...(b2c ? { b2c } : {}),
        ...(b2b ? { b2b } : {}),
      }),
    }
  } catch (err) {
    console.error('[comando]', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao calcular os dados dos comandos' }) }
  }
}
