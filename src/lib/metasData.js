// Cálculo do painel Metas Semanais (src/pages/MetasSemanais.jsx) em formato
// serializável. Módulo compartilhado por dois consumidores externos:
//   - netlify/functions/metas-semanais.js  → REST (GET /api/metas-semanais)
//   - netlify/functions/mcp.js             → MCP remoto (POST /mcp)
//
// Reusa a mesma lógica do painel (weeklyGoalsEngine.js), então nunca diverge.
import { fetchAllDealsByPipeline, fetchGoals, fetchUserActivitiesInRange } from '../services/pipedriveApi.js'
import { SELLERS } from '../hooks/useSellerData.js'
import { SELLERS_B2B } from '../hooks/useSellerDataB2B.js'
import { PROGRAMS, PROGRAMS_B2B } from '../config/pipedrive.js'
import { computeWeeklyGoalsRows, toISODate, MS_PER_DAY } from './weeklyGoalsEngine.js'

export const SEGMENTS = {
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

// Ponto de entrada principal — carrega B2C, B2B, ou ambos.
// Retorna { generatedAt, goalsUnavailable, b2c?, b2b? }
export async function loadMetas(wantB2C = true, wantB2B = true) {
  const goalsData = await fetchGoals().catch((err) => {
    console.warn('[metasData] metas do Pipedrive indisponíveis:', err)
    return null
  })
  const goals = goalsData?.goals || []
  const goalsUnavailable = !goalsData

  const [b2c, b2b] = await Promise.all([
    wantB2C ? loadSegment(SEGMENTS.b2c, goals) : null,
    wantB2B ? loadSegment(SEGMENTS.b2b, goals) : null,
  ])

  return {
    generatedAt: new Date().toISOString(),
    goalsUnavailable,
    ...(b2c ? { b2c } : {}),
    ...(b2b ? { b2b } : {}),
  }
}
