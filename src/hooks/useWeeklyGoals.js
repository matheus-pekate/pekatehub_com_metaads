import { useState, useEffect, useCallback } from 'react'
import { fetchAllDealsByPipeline, fetchUserActivitiesInRange, fetchUsers, fetchGoals } from '../services/pipedriveApi.js'
import { SELLERS } from './useSellerData.js'
import { PROGRAMS } from '../config/pipedrive.js'
import { computeWeeklyGoalsRows, toISODate, MS_PER_DAY } from '../lib/weeklyGoalsEngine.js'

// Fábrica: gera o hook do painel de metas semanais para um conjunto de
// vendedores + programas (usada tanto pelo B2C quanto pelo espelho B2B).
// Só cuida de buscar os dados da API do Pipedrive e manter o estado do
// React — todo o cálculo (metas, semana, leads qualificados, oportunidades
// por negócio fechado) vive em `../lib/weeklyGoalsEngine.js`, reusado
// também pela Netlify Function que expõe esses mesmos números em JSON.
// `activityLookbackDays` define a janela usada pra calcular "quantas
// oportunidades qualificadas, em média, o vendedor precisa trabalhar até
// fechar 1 negócio" — precisa ser ampla o bastante pra pegar uma amostra
// razoável de deals ganhos (o B2B tem ciclo de venda bem mais longo que o
// B2C).
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

    const { rows, weekStart, weekEnd } = !loading
      ? computeWeeklyGoalsRows(sellers, programs, { allDeals, goals, avatarMap, goalActivitiesMap, activityLookbackDays })
      : { rows: [], weekStart: null, weekEnd: null }

    return { rows, loading, goalsUnavailable, weekStart, weekEnd, activityLookbackDays }
  }
}

export const useWeeklyGoals = createWeeklyGoalsHook(SELLERS, PROGRAMS, { activityLookbackDays: 90 })
