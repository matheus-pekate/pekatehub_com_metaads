import { useState, useEffect, useCallback } from 'react'
import { fetchAllDealsByPipeline, fetchUserActivities, fetchUsers, fetchDealDetails } from '../services/pipedriveApi.js'
import { PROGRAMS } from '../config/pipedrive.js'
import { SELLERS, computeSellerMetrics } from './useSellerData.js'

export function useRankingData() {
  const [allDeals, setAllDeals] = useState([])
  const [activitiesMap, setActivitiesMap] = useState({})
  const [avatarMap, setAvatarMap] = useState({})
  const [stageTimesMap, setStageTimesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState('')
  const [periodDays, setPeriodDays] = useState(30)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [dealsByPipeline, users] = await Promise.all([
        Promise.all(PROGRAMS.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
        fetchUsers(),
      ])
      const deals = dealsByPipeline.flat()
      setAllDeals(deals)

      const avatars = {}
      ;(users || []).forEach((u) => {
        const pics = u.picture_id?.pictures
        avatars[u.id] = pics?.['128'] || pics?.['512'] || pics?.['original'] || u.icon_url || null
      })
      setAvatarMap(avatars)

      const actResults = await Promise.all(
        SELLERS.map(async (s) => {
          const acts = await fetchUserActivities(s.id, periodDays)
          return { id: s.id, acts: acts || [] }
        })
      )
      const map = {}
      actResults.forEach(({ id, acts }) => { map[id] = acts })
      setActivitiesMap(map)

      const wonDealIds = deals
        .filter((d) => d.status === 'won' && d.won_time)
        .sort((a, b) => new Date(b.won_time) - new Date(a.won_time))
        .slice(0, 40)
        .map((d) => d.id)
      const stMap = {}
      for (let i = 0; i < wonDealIds.length; i += 10) {
        const batch = wonDealIds.slice(i, i + 10)
        const batchRes = await Promise.all(
          batch.map(async (id) => {
            try {
              const detail = await fetchDealDetails(id)
              return { id, times: detail?.stay_in_pipeline_stages?.times_in_stages || {} }
            } catch { return { id, times: {} } }
          })
        )
        batchRes.forEach(({ id, times }) => { stMap[id] = times })
      }
      setStageTimesMap(stMap)
    } catch (err) {
      console.error('[useRankingData] Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [periodDays])

  useEffect(() => { loadData() }, [loadData])

  // Compute full metrics for every seller
  const sellersData = !loading
    ? SELLERS.map((s) => {
        const m = computeSellerMetrics(s.id, allDeals, activitiesMap[s.id], periodDays, selectedProgram || null, stageTimesMap)
        return {
          ...s,
          avatarUrl: avatarMap[s.id] || null,
          metrics: m,
        }
      })
    : []

  // Pre-compute team averages for comparison bars
  const teamAvg = sellersData.length > 0
    ? {
        converted: Math.round(sellersData.reduce((s, d) => s + d.metrics.converted, 0) / sellersData.length * 10) / 10,
        revenue: Math.round(sellersData.reduce((s, d) => s + d.metrics.revenue, 0) / sellersData.length),
        conversionRate: Math.round(sellersData.reduce((s, d) => s + d.metrics.conversionRate, 0) / sellersData.length * 10) / 10,
        ticketMedio: Math.round(sellersData.reduce((s, d) => s + d.metrics.ticketMedio, 0) / sellersData.length),
        openDeals: Math.round(sellersData.reduce((s, d) => s + d.metrics.openDeals, 0) / sellersData.length * 10) / 10,
        pipelineValue: Math.round(sellersData.reduce((s, d) => s + d.metrics.pipelineValue, 0) / sellersData.length),
        totalActivities: Math.round(sellersData.reduce((s, d) => s + d.metrics.activities.total, 0) / sellersData.length * 10) / 10,
        cadenceFreq: Math.round(sellersData.reduce((s, d) => s + d.metrics.cadence.frequency, 0) / sellersData.length * 10) / 10,
        avgConvDays: (() => {
          const arr = sellersData.filter((d) => d.metrics.velocity.avgConversionDays != null).map((d) => d.metrics.velocity.avgConversionDays)
          return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
        })(),
      }
    : null

  // Sort by revenue for ranking
  const ranked = [...sellersData].sort((a, b) => b.metrics.revenue - a.metrics.revenue)

  return {
    sellers: SELLERS,
    programs: PROGRAMS,
    loading,
    sellersData: ranked,
    teamAvg,
    selectedProgram,
    setSelectedProgram,
    periodDays,
    setPeriodDays,
  }
}
