// Expõe os números do painel "Metas Semanais" (src/pages/MetasSemanais.jsx)
// em JSON, pra um agente do n8n (ou qualquer outro consumidor externo)
// consultar sob demanda — mesma lógica de cálculo do painel (weeklyGoalsEngine.js),
// então os dois nunca ficam dessincronizados.
//
// GET /api/metas-semanais?segment=ambos|b2c|b2b
//
// Se a env var METAS_API_SECRET estiver configurada na Netlify, a chamada
// precisa do header `x-metas-secret` com o mesmo valor — sem essa env var,
// o endpoint fica aberto (mesma postura dos outros endpoints deste hub).
import { fetchAllDealsByPipeline, fetchUsers, fetchGoals, fetchUserActivitiesInRange } from '../../src/services/pipedriveApi.js'
import { SELLERS } from '../../src/hooks/useSellerData.js'
import { SELLERS_B2B } from '../../src/hooks/useSellerDataB2B.js'
import { PROGRAMS, PROGRAMS_B2B } from '../../src/config/pipedrive.js'
import { computeWeeklyGoalsRows, toISODate, MS_PER_DAY } from '../../src/lib/weeklyGoalsEngine.js'

const SEGMENTS = {
  b2c: { sellers: SELLERS, programs: PROGRAMS, activityLookbackDays: 90 },
  b2b: { sellers: SELLERS_B2B, programs: PROGRAMS_B2B, activityLookbackDays: 365 },
}

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function goalLabel(goal, metricLabelPlural) {
  if (!goal) return 'standby (sem meta ativa no Pipedrive)'
  const target = goal.metric === 'sum' ? formatBRL(goal.target) : `${goal.target} ${metricLabelPlural}`
  const tag = goal.source === 'weekly' ? 'meta semanal' : `estimativa (meta ${goal.source} ÷ proporção)`
  return `${target} — ${tag}`
}

// Uma linha de texto pronta por vendedor, pra um agente de LLM não precisar
// interpretar os números crus se não quiser.
function summarizeRow(row) {
  if (row.metricType === 'activity') {
    const goalTxt = goalLabel(row.goal, row.metricLabelPlural)
    return `${row.name} (SDR) — ${row.metricLabelPlural} na semana: ${row.wonThisWeek} · meta: ${goalTxt}` +
      (row.progressPct != null ? ` · ${row.progressPct}% da meta` : '')
  }
  const c = row.closed
  const q = row.qualified
  const closedTxt = `negócios fechados: ${c.wonThisWeek} (${formatBRL(c.revenueThisWeek)}) · meta: ${goalLabel(c.goal, 'negócios')}` +
    (c.progressPct != null ? ` · ${c.progressPct}% da meta` : '')
  const qualifiedTxt = `leads qualificados: ${q.countThisWeek} · meta: ${goalLabel(q.goal, 'leads')}` +
    (q.progressPct != null ? ` · ${q.progressPct}% da meta` : '')
  const oppsTxt = c.oppsPerDeal != null ? ` · precisa de ~${c.oppsPerDeal} oportunidades qualificadas pra fechar 1 negócio` : ''
  return `${row.name} — ${closedTxt} | ${qualifiedTxt}${oppsTxt}`
}

async function loadSegment({ sellers, programs, activityLookbackDays }, goals) {
  const lookbackStartStr = toISODate(new Date(Date.now() - activityLookbackDays * MS_PER_DAY))
  const todayStr = toISODate(new Date())

  const dealsByPipeline = await Promise.all(programs.map((p) => fetchAllDealsByPipeline(p.pipelineId)))
  const allDeals = dealsByPipeline.flat()

  const goalMetricSellers = sellers.filter((s) => s.goalMetric?.type === 'activity')
  const goalActivitiesMap = {}
  if (goalMetricSellers.length > 0) {
    const results = await Promise.all(
      goalMetricSellers.map(async (s) => ({
        id: s.id,
        acts: (await fetchUserActivitiesInRange(s.id, lookbackStartStr, todayStr, { done: null })) || [],
      }))
    )
    results.forEach(({ id, acts }) => { goalActivitiesMap[id] = acts })
  }

  const { rows, weekStart, weekEnd } = computeWeeklyGoalsRows(sellers, programs, {
    allDeals, goals, goalActivitiesMap, activityLookbackDays,
  })

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    activityLookbackDays,
    sellers: rows.map((row) => ({ ...row, summary: summarizeRow(row) })),
  }
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

  try {
    // fetchUsers()/avatares não interessam pra um consumidor de API — pulamos.
    const goalsData = await fetchGoals().catch((err) => {
      console.warn('[metas-semanais] metas do Pipedrive indisponíveis:', err)
      return null
    })
    const goals = goalsData?.goals || []
    const goalsUnavailable = !goalsData

    const [b2c, b2b] = await Promise.all([
      wantB2C ? loadSegment(SEGMENTS.b2c, goals) : null,
      wantB2B ? loadSegment(SEGMENTS.b2b, goals) : null,
    ])

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedAt: new Date().toISOString(),
        goalsUnavailable,
        ...(b2c ? { b2c } : {}),
        ...(b2b ? { b2b } : {}),
      }),
    }
  } catch (err) {
    console.error('[metas-semanais]', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao calcular as metas semanais' }) }
  }
}
