import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchAllDealsByPipeline } from '../services/pipedriveApi.js'
import { PROGRAMS_B2B, REFRESH_INTERVAL_MINUTES } from '../config/pipedrive.js'

// Calcula o intervalo [início, fim) de um período de calendário fixo
export function getPeriodRange({ year, half }) {
  if (half === 'S1') return [new Date(year, 0, 1), new Date(year, 6, 1)]
  if (half === 'S2') return [new Date(year, 6, 1), new Date(year + 1, 0, 1)]
  return [new Date(year, 0, 1), new Date(year + 1, 0, 1)] // 'ANO'
}

function inRange(dateStr, [start, end]) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= start && d < end
}

// Processa os deals de um programa B2B: funil sempre no estado atual,
// receita/conversão filtradas pelo período de calendário selecionado.
function processB2BProgram(program, deals, range) {
  const stageMap = {}
  program.stages.forEach((s) => {
    stageMap[s.id] = { ...s, count: 0, value: 0 }
  })

  const openDeals = deals.filter((d) => d.status === 'open')
  openDeals.forEach((deal) => {
    const bucket = stageMap[deal.stage_id]
    if (bucket) {
      bucket.count++
      bucket.value += deal.value || 0
    }
  })
  const stagesData = program.stages.map((s) => stageMap[s.id])

  const wonInPeriod = deals.filter((d) => d.status === 'won' && inRange(d.won_time, range))
  const lostInPeriod = deals.filter((d) => d.status === 'lost' && inRange(d.lost_time, range))

  const wonCount = wonInPeriod.length
  const totalWonValue = wonInPeriod.reduce((acc, d) => acc + (d.value || 0), 0)
  const avgTicket = wonCount > 0 ? totalWonValue / wonCount : 0

  const closedCount = wonCount + lostInPeriod.length
  const conversionRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0

  // Forecast: leads abertos a partir do 3º estágio do funil (mesmo critério do Comando B2C)
  const forecastStageIds = new Set(program.stages.slice(2).map((s) => s.id))
  const forecastDeals = openDeals.filter((d) => forecastStageIds.has(d.stage_id))
  const forecastValue = forecastDeals.reduce((acc, d) => acc + (d.value || 0), 0)
  const forecastCount = forecastDeals.length

  const totalOpenCount = openDeals.length
  const totalOpenValue = openDeals.reduce((acc, d) => acc + (d.value || 0), 0)

  return {
    stagesData,
    wonCount,
    totalWonValue,
    avgTicket,
    conversionRate,
    forecastValue,
    forecastCount,
    totalOpenCount,
    totalOpenValue,
  }
}

export function useB2BDashboardData(period) {
  const [rawDeals, setRawDeals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)
      const results = await Promise.all(
        PROGRAMS_B2B.map((p) => fetchAllDealsByPipeline(p.pipelineId))
      )
      const byId = {}
      PROGRAMS_B2B.forEach((p, idx) => {
        byId[p.id] = results[idx]
      })
      setRawDeals(byId)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch inicial
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MINUTES * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Agregação por período: recalcula na hora ao trocar semestre/ano, sem rebater na API
  const data = useMemo(() => {
    if (!rawDeals) return null

    const range = getPeriodRange(period)
    const programs = PROGRAMS_B2B.map((program) => {
      const deals = rawDeals[program.id] || []
      const metrics = processB2BProgram(program, deals, range)
      return { ...program, ...metrics }
    })

    const totals = programs.reduce(
      (acc, p) => ({
        totalWonValue: acc.totalWonValue + p.totalWonValue,
        wonCount: acc.wonCount + p.wonCount,
        totalOpenValue: acc.totalOpenValue + p.totalOpenValue,
        totalOpenCount: acc.totalOpenCount + p.totalOpenCount,
        forecastValue: acc.forecastValue + p.forecastValue,
      }),
      { totalWonValue: 0, wonCount: 0, totalOpenValue: 0, totalOpenCount: 0, forecastValue: 0 }
    )
    totals.avgTicket = totals.wonCount > 0 ? totals.totalWonValue / totals.wonCount : 0

    return { programs, totals }
  }, [rawDeals, period.year, period.half])

  return { data, loading, error, lastUpdated, refresh: fetchAll }
}
