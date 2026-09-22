import { useState, useEffect, useCallback } from 'react'
import { fetchAllDealsByPipeline, fetchUserActivitiesInRange, fetchUsers, fetchGoals } from '../services/pipedriveApi.js'
import { SELLERS, filterDealsBySingleProgram } from './useSellerData.js'
import { PROGRAMS } from '../config/pipedrive.js'

const MS_PER_DAY = 86400000

// ids numéricos dos tipos de atividade no Pipedrive da Pekatê (activityTypes)
// — usados só pra escopar metas do tipo "atividade" (ex.: reunião agendada).
const ACTIVITY_TYPE_IDS = { call: 1, meeting: 2, task: 3, deadline: 4, email: 5 }

// Semana corrente (segunda 00:00 → próxima segunda 00:00, hora local).
function getWeekRange(now = new Date()) {
  const day = now.getDay() // 0 = domingo
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
  const end = new Date(start.getTime() + 7 * MS_PER_DAY)
  return { start, end }
}

function toISODate(date) {
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

// Fábrica: gera o hook do painel de metas semanais para um conjunto de
// vendedores + programas (usada tanto pelo B2C quanto pelo espelho B2B).
// Cada vendedor "normal" (`buildDealsMetricRow`) carrega DUAS metas por
// programa (e um total agregado): negócio fechado e leads qualificados.
// `activityLookbackDays` define a janela usada pra calcular "quantas
// oportunidades qualificadas, em média, o vendedor precisa trabalhar até
// fechar 1 negócio" — precisa ser ampla o bastante pra pegar uma amostra
// razoável de deals ganhos (o B2B tem ciclo de venda bem mais longo que o
// B2C). Vendedores com `goalMetric` (ex.: SDR cuja meta é atividade, não
// negócio) usam uma lógica de meta/realizado totalmente à parte — ver
// `buildActivityMetricRow`.
export function createWeeklyGoalsHook(sellers, programs, { activityLookbackDays = 90 } = {}) {
  return function useWeeklyGoalsHook({ enabled = true } = {}) {
    const [allDeals, setAllDeals] = useState([])
    const [goalActivitiesMap, setGoalActivitiesMap] = useState({})
    const [avatarMap, setAvatarMap] = useState({})
    const [goals, setGoals] = useState([])
    const [goalsUnavailable, setGoalsUnavailable] = useState(false)
    const [loading, setLoading] = useState(enabled)
    const [everEnabled, setEverEnabled] = useState(enabled)

    const loadData = useCallback(async () => {
      setLoading(true)
      try {
        const lookbackStartStr = toISODate(new Date(Date.now() - activityLookbackDays * MS_PER_DAY))
        const todayStr = toISODate(new Date())

        const [dealsByPipeline, users, goalsData] = await Promise.all([
          Promise.all(programs.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
          fetchUsers(),
          fetchGoals().catch((err) => {
            console.warn('[useWeeklyGoals] metas do Pipedrive indisponíveis:', err)
            return null
          }),
        ])
        setAllDeals(dealsByPipeline.flat())
        if (goalsData) {
          setGoals(goalsData.goals || [])
          setGoalsUnavailable(false)
        } else {
          setGoalsUnavailable(true)
        }

        const avatars = {}
        ;(users || []).forEach((u) => {
          const pics = u.picture_id?.pictures
          avatars[u.id] = pics?.['128'] || pics?.['512'] || pics?.['original'] || u.icon_url || null
        })
        setAvatarMap(avatars)

        // Vendedores com meta de atividade (ex.: SDR — "reunião agendada")
        // precisam de TODAS as atividades do tipo (concluídas ou não), já
        // que "agendada" não exige que a reunião já tenha acontecido.
        const goalMetricSellers = sellers.filter((s) => s.goalMetric?.type === 'activity')
        if (goalMetricSellers.length > 0) {
          const gActResults = await Promise.all(
            goalMetricSellers.map(async (s) => ({
              id: s.id,
              acts: (await fetchUserActivitiesInRange(s.id, lookbackStartStr, todayStr, { done: null })) || [],
            }))
          )
          const gMap = {}
          gActResults.forEach(({ id, acts }) => { gMap[id] = acts })
          setGoalActivitiesMap(gMap)
        } else {
          setGoalActivitiesMap({})
        }
      } catch (err) {
        console.error('[useWeeklyGoals] Erro:', err)
      } finally {
        setLoading(false)
      }
    }, [])

    useEffect(() => {
      if (enabled && !everEnabled) setEverEnabled(true)
    }, [enabled, everEnabled])

    useEffect(() => {
      if (!everEnabled) return
      loadData()
    }, [loadData, everEnabled])

    const now = new Date()
    const { start: weekStart, end: weekEnd } = getWeekRange(now)
    const lookbackStart = new Date(now.getTime() - activityLookbackDays * MS_PER_DAY)

    // deal.id → deal completo, pra descobrir a qual programa cada atividade
    // pertence (via activity.deal_id) e checar campos customizados do deal
    // (ex.: "SDR") sem precisar de mais chamadas à API.
    const dealById = {}
    allDeals.forEach((d) => { dealById[d.id] = d })

    // Vendedor "normal" — meta dupla (negócio fechado + leads qualificados)
    // por programa, e um total agregado. Mostra TODOS os programas
    // configurados, mesmo sem nenhum negócio ainda — painel já fica pronto
    // pra próxima virada de ano/turma sem precisar mexer em código.
    function buildDealsMetricRow(s) {
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
    function buildActivityMetricRow(s) {
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

    const rows = !loading
      ? sellers.map((s) => (s.goalMetric?.type === 'activity' ? buildActivityMetricRow(s) : buildDealsMetricRow(s)))
      : []

    return { rows, loading, goalsUnavailable, weekStart, weekEnd, activityLookbackDays }
  }
}

export const useWeeklyGoals = createWeeklyGoalsHook(SELLERS, PROGRAMS, { activityLookbackDays: 90 })
