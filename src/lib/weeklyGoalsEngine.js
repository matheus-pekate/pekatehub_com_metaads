// Motor de cálculo do painel de Metas Semanais — puro (sem React, sem
// chamadas à API), usado tanto pelo hook do browser (useWeeklyGoals.js)
// quanto pela Netlify Function (netlify/functions/metas-semanais.js) que
// expõe os mesmos números em JSON pra um agente do n8n consumir. Mantendo
// a regra de negócio num lugar só, os dois lados nunca ficam dessincronizados.
import { filterDealsBySingleProgram } from '../hooks/useSellerData.js'

export const MS_PER_DAY = 86400000

// ids numéricos dos tipos de atividade no Pipedrive da Pekatê (activityTypes)
// — usados só pra escopar metas do tipo "atividade" (ex.: reunião agendada).
export const ACTIVITY_TYPE_IDS = { call: 1, meeting: 2, task: 3, deadline: 4, email: 5 }

// Semana corrente (segunda 00:00 → próxima segunda 00:00, hora local).
export function getWeekRange(now = new Date()) {
  const day = now.getDay() // 0 = domingo
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
  const end = new Date(start.getTime() + 7 * MS_PER_DAY)
  return { start, end }
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

// Acha, dentro de uma meta com sazonalidade, o alvo do intervalo que contém
// a data de hoje — senão usa o expected_outcome fixo da meta.
function currentGoalTarget(goal, now) {
  if (goal.expected_outcome) return goal.expected_outcome
  const intervals = goal.seasonality?.intervals || []
  const active = intervals.find((iv) => now >= new Date(iv.start) && now <= new Date(iv.end))
  if (!active) return null
  return { tracking_metric: goal.seasonality.tracking_metric, currency_id: goal.seasonality.currency_id, target: active.target }
}

// Reduz uma lista de metas candidatas (já filtradas por tipo/pessoa/escopo)
// à meta semanal em vigor — prioriza meta semanal explícita; na ausência
// dela, prorata meta mensal/anual (marcando como estimativa).
function resolveGoalFromCandidates(candidates, now) {
  if (candidates.length === 0) return null
  const byInterval = (name) => candidates.find((g) => g.interval === name)

  const weekly = byInterval('weekly')
  if (weekly) {
    const t = currentGoalTarget(weekly, now)
    if (t) return { source: 'weekly', estimated: false, metric: t.tracking_metric, currencyId: t.currency_id, target: t.target }
  }

  const monthly = byInterval('monthly')
  if (monthly) {
    const t = currentGoalTarget(monthly, now)
    if (t) return { source: 'monthly', estimated: true, metric: t.tracking_metric, currencyId: t.currency_id, target: Math.round((t.target / 30) * 7 * 10) / 10 }
  }

  const yearly = byInterval('yearly')
  if (yearly) {
    const t = currentGoalTarget(yearly, now)
    if (t) return { source: 'yearly', estimated: true, metric: t.tracking_metric, currencyId: t.currency_id, target: Math.round((t.target / 365) * 7 * 10) / 10 }
  }

  return null
}

// Procura, entre as metas ativas do Pipedrive, uma meta de "negócios
// ganhos" atribuída a este vendedor — se `pipelineId` for informado, só
// considera metas sem escopo de pipeline (valem pra tudo) ou que incluam
// esse pipeline explicitamente (`type.params.pipeline_id`). Só fica em
// standby se não houver NENHUMA meta ativa de negócios ganhos pro vendedor
// (e programa, quando informado).
function matchDealsWonGoal(goals, sellerId, now, pipelineId = null) {
  const candidates = (goals || []).filter((g) => {
    if (!g.is_active || g.type?.name !== 'deals_won') return false
    if (g.assignee?.type !== 'person' || g.assignee?.id !== sellerId) return false
    const scopedPipelines = g.type?.params?.pipeline_id
    if (pipelineId != null && scopedPipelines && !scopedPipelines.includes(pipelineId)) return false
    return true
  })
  return resolveGoalFromCandidates(candidates, now)
}

// Mesma lógica, mas pra meta de "leads qualificados" (Pipedrive: meta do
// tipo `deals_progressed`, escopada por pipeline + stage) — se `stageId`
// for informado, só considera metas sem escopo de stage ou que apontem
// pra esse stage explicitamente.
function matchQualifiedLeadsGoal(goals, sellerId, now, pipelineId = null, stageId = null) {
  const candidates = (goals || []).filter((g) => {
    if (!g.is_active || g.type?.name !== 'deals_progressed') return false
    if (g.assignee?.type !== 'person' || g.assignee?.id !== sellerId) return false
    const scopedPipelines = g.type?.params?.pipeline_id
    if (pipelineId != null && scopedPipelines && !scopedPipelines.includes(pipelineId)) return false
    const scopedStage = g.type?.params?.stage_id
    if (stageId != null && scopedStage != null && scopedStage !== stageId) return false
    return true
  })
  return resolveGoalFromCandidates(candidates, now)
}

// Mesma lógica, mas pra metas do tipo "atividade" (ex.: reuniões
// agendadas/concluídas) — usada por vendedores com `goalMetric.type ===
// 'activity'` (ex.: SDR cuja meta não é negócio fechado).
function matchActivityGoal(goals, sellerId, now, activityTypeId) {
  const candidates = (goals || []).filter((g) => {
    if (!g.is_active) return false
    if (!['activities_completed', 'activities_added'].includes(g.type?.name)) return false
    if (g.assignee?.type !== 'person' || g.assignee?.id !== sellerId) return false
    const scopedTypes = g.type?.params?.activity_type_id
    if (activityTypeId != null && scopedTypes && !scopedTypes.includes(activityTypeId)) return false
    return true
  })
  return resolveGoalFromCandidates(candidates, now)
}

function wonInRange(deals, start, end) {
  return deals.filter((d) => {
    if (d.status !== 'won') return false
    const wt = d.won_time || d.close_time
    if (!wt) return false
    const dt = new Date(wt)
    return dt >= start && dt < end
  })
}

// ids de todos os stages do programa a partir do "Qualificado" (inclusive)
// — um deal cujo stage atual está nessa lista já passou pela qualificação,
// mesmo que já tenha avançado além dela.
function qualifyingStageIds(cfg) {
  const idx = cfg.stages.findIndex((s) => s.id === cfg.qualifiedStageId)
  if (idx === -1) return []
  return cfg.stages.slice(idx).map((s) => s.id)
}

// "Qualificado nesta semana" = deal está (ou já passou d)o stage de
// qualificação E a última mudança de stage (`stage_change_time`, campo
// nativo do Pipedrive) caiu dentro da janela — não temos histórico
// completo de mudança de stage sem custo extra de API, então isso é uma
// aproximação: um deal que pulou direto de "Cliente Potencial" pra
// "Negociação" na mesma call ainda conta (ele passou pela qualificação).
function qualifiedInRange(deals, stageIds, start, end) {
  if (stageIds.length === 0) return []
  return deals.filter((d) => {
    if (!stageIds.includes(d.stage_id)) return false
    if (!d.stage_change_time) return false
    const dt = new Date(d.stage_change_time)
    return dt >= start && dt < end
  })
}

function activityDate(a) {
  const d = a.due_date || a.add_time
  return d ? new Date(d) : null
}

function progressPctOf(goal, count, revenue) {
  if (!goal || !(goal.target > 0)) return null
  const progressCount = goal.metric === 'sum' ? revenue : count
  return Math.round((progressCount / goal.target) * 1000) / 10
}

// Quantas oportunidades (leads qualificados) o vendedor precisou trabalhar,
// em média, pra fechar 1 negócio — inverso da taxa de conversão qualificado
// → ganho, no período de referência (lookback).
function oppsPerDeal(qualifiedLookbackCount, wonLookbackCount) {
  return wonLookbackCount > 0 && qualifiedLookbackCount > 0
    ? Math.round((qualifiedLookbackCount / wonLookbackCount) * 10) / 10
    : null
}

// Vendedor "normal" — meta dupla (negócio fechado + leads qualificados)
// por programa, e um total agregado. Sempre inclui TODOS os programas
// configurados, mesmo sem nenhum negócio ainda — painel já fica pronto
// pra próxima virada de ano/turma sem precisar mexer em código.
function buildDealsMetricRow(s, { allDeals, programs, goals, avatarMap, now, weekStart, weekEnd, lookbackStart }) {
  const sellerDeals = allDeals.filter((d) => d.owner_id === s.id || d.user_id === s.id)

  const wonThisWeek = wonInRange(sellerDeals, weekStart, weekEnd)
  const revenueThisWeek = wonThisWeek.reduce((sum, d) => sum + (d.value || 0), 0)
  const wonLookback = sellerDeals.filter((d) => {
    if (d.status !== 'won') return false
    const wt = d.won_time || d.close_time
    return wt ? new Date(wt) >= lookbackStart : false
  })
  const closedGoal = matchDealsWonGoal(goals, s.id, now, null)
  const closedProgressPct = progressPctOf(closedGoal, wonThisWeek.length, revenueThisWeek)

  let qualifiedThisWeekTotal = 0
  let qualifiedLookbackTotal = 0

  const programBreakdown = programs.map((cfg) => {
    const programDeals = filterDealsBySingleProgram(sellerDeals, cfg)
    const programWonThisWeek = wonInRange(programDeals, weekStart, weekEnd)
    const programRevenueThisWeek = programWonThisWeek.reduce((sum, d) => sum + (d.value || 0), 0)
    const programWonLookback = programDeals.filter((d) => {
      if (d.status !== 'won') return false
      const wt = d.won_time || d.close_time
      return wt ? new Date(wt) >= lookbackStart : false
    })
    const closedProgramGoal = matchDealsWonGoal(goals, s.id, now, cfg.pipelineId)
    const closedProgramProgressPct = progressPctOf(closedProgramGoal, programWonThisWeek.length, programRevenueThisWeek)

    const qStageIds = qualifyingStageIds(cfg)
    const programQualifiedThisWeek = qualifiedInRange(programDeals, qStageIds, weekStart, weekEnd)
    const programQualifiedLookback = qualifiedInRange(programDeals, qStageIds, lookbackStart, now)
    qualifiedThisWeekTotal += programQualifiedThisWeek.length
    qualifiedLookbackTotal += programQualifiedLookback.length
    const qualifiedProgramGoal = matchQualifiedLeadsGoal(goals, s.id, now, cfg.pipelineId, cfg.qualifiedStageId)
    const qualifiedProgramProgressPct = progressPctOf(qualifiedProgramGoal, programQualifiedThisWeek.length, 0)

    return {
      programId: cfg.id,
      programName: cfg.name,
      shortName: cfg.shortName,
      accentColor: cfg.accentColor,
      closed: {
        wonThisWeek: programWonThisWeek.length,
        revenueThisWeek: programRevenueThisWeek,
        wonLookbackCount: programWonLookback.length,
        oppsPerDeal: oppsPerDeal(programQualifiedLookback.length, programWonLookback.length),
        goal: closedProgramGoal,
        progressPct: closedProgramProgressPct,
      },
      qualified: {
        countThisWeek: programQualifiedThisWeek.length,
        countLookback: programQualifiedLookback.length,
        goal: qualifiedProgramGoal,
        progressPct: qualifiedProgramProgressPct,
      },
    }
  })

  const qualifiedGoal = matchQualifiedLeadsGoal(goals, s.id, now, null, null)
  const qualifiedProgressPct = progressPctOf(qualifiedGoal, qualifiedThisWeekTotal, 0)

  return {
    id: s.id,
    name: s.name,
    avatarUrl: avatarMap[s.id] || null,
    metricType: 'deals',
    closed: {
      wonThisWeek: wonThisWeek.length,
      revenueThisWeek,
      wonLookbackCount: wonLookback.length,
      oppsPerDeal: oppsPerDeal(qualifiedLookbackTotal, wonLookback.length),
      goal: closedGoal,
      progressPct: closedProgressPct,
    },
    qualified: {
      countThisWeek: qualifiedThisWeekTotal,
      countLookback: qualifiedLookbackTotal,
      goal: qualifiedGoal,
      progressPct: qualifiedProgressPct,
    },
    programs: programBreakdown,
  }
}

// Vendedor cuja meta é uma atividade (ex.: reunião agendada) em vez de
// negócio fechado — filtra pelo tipo de atividade, dono e, opcionalmente,
// um campo customizado do deal vinculado (ex.: SDR = "Lucas").
function buildActivityMetricRow(s, { goals, avatarMap, dealById, goalActivitiesMap, now, weekStart, weekEnd, lookbackStart }) {
  const { goalMetric } = s
  const activityTypeId = ACTIVITY_TYPE_IDS[goalMetric.activityType] ?? null
  const rawActs = goalActivitiesMap[s.id] || []

  const qualifying = rawActs.filter((a) => {
    if (a.type !== goalMetric.activityType) return false
    if (goalMetric.dealCustomField) {
      const deal = dealById[a.deal_id]
      const fieldValue = deal?.custom_fields?.[goalMetric.dealCustomField.key]
      if (fieldValue !== goalMetric.dealCustomField.value) return false
    }
    return true
  })

  const thisWeek = qualifying.filter((a) => {
    const dt = activityDate(a)
    return dt && dt >= weekStart && dt < weekEnd
  })
  const lookback = qualifying.filter((a) => {
    const dt = activityDate(a)
    return dt && dt >= lookbackStart
  })

  const goal = matchActivityGoal(goals, s.id, now, activityTypeId)
  const progressPct = progressPctOf(goal, thisWeek.length, 0)

  return {
    id: s.id,
    name: s.name,
    avatarUrl: avatarMap[s.id] || null,
    metricType: 'activity',
    metricLabel: goalMetric.label,
    metricLabelPlural: goalMetric.labelPlural,
    wonThisWeek: thisWeek.length,
    revenueThisWeek: 0,
    wonLookbackCount: lookback.length,
    goal,
    progressPct,
    programs: [],
  }
}

// Ponto de entrada único: recebe os dados já buscados na API (deals, metas,
// atividades dos vendedores com meta de atividade, avatares) e devolve as
// linhas do painel prontas — mesma saída usada pela UI e pela Netlify
// Function. `activityLookbackDays` deve ser o mesmo valor usado pra buscar
// `goalActivitiesMap` (90 dias no B2C, 365 no B2B).
export function computeWeeklyGoalsRows(sellers, programs, { allDeals, goals, avatarMap = {}, goalActivitiesMap = {}, activityLookbackDays = 90, now = new Date() }) {
  const { start: weekStart, end: weekEnd } = getWeekRange(now)
  const lookbackStart = new Date(now.getTime() - activityLookbackDays * MS_PER_DAY)

  const dealById = {}
  allDeals.forEach((d) => { dealById[d.id] = d })

  const ctx = { allDeals, programs, goals, avatarMap, dealById, goalActivitiesMap, now, weekStart, weekEnd, lookbackStart }

  const rows = sellers.map((s) => (
    s.goalMetric?.type === 'activity' ? buildActivityMetricRow(s, ctx) : buildDealsMetricRow(s, ctx)
  ))

  return { rows, weekStart, weekEnd, activityLookbackDays }
}
