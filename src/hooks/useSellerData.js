import { useState, useEffect, useCallback } from 'react'
import { fetchAllDealsByPipeline, fetchUserActivities, fetchUsers, fetchDealDetails } from '../services/pipedriveApi.js'
import { PROGRAMS } from '../config/pipedrive.js'

export const SELLERS = [
  { id: 15308928, name: 'Kelvem Vieira' },
  { id: 22690703, name: 'Itallo Oliveira' },
  { id: 15066063, name: 'Fernando' },
]

const MS_PER_DAY = 86400000

function filterDealsBySingleProgram(deals, cfg) {
  let filtered = deals.filter((d) => d.pipeline_id === cfg.pipelineId)
  if (cfg.convertedFilter) {
    const { customField, value } = cfg.convertedFilter
    filtered = filtered.filter((d) => {
      const fv = d.custom_fields?.[customField]
      return fv === value || fv === String(value)
    })
  }
  return filtered
}

function filterDealsByProgram(deals, program) {
  if (!program) {
    return PROGRAMS.flatMap((cfg) => filterDealsBySingleProgram(deals, cfg))
  }
  const cfg = PROGRAMS.find((p) => p.id === program)
  if (!cfg) return deals
  return filterDealsBySingleProgram(deals, cfg)
}

export function computeSellerMetrics(sellerId, allDeals, activities, periodDays, programFilter, stageTimesMap) {
  const now = new Date()
  const periodStart = new Date(now.getTime() - periodDays * MS_PER_DAY)
  const prevPeriodStart = new Date(now.getTime() - 2 * periodDays * MS_PER_DAY)
  const weekAgo = new Date(now.getTime() - 7 * MS_PER_DAY)

  const deals = filterDealsByProgram(allDeals, programFilter)
    .filter((d) => d.owner_id === sellerId || d.user_id === sellerId)

  const wonDeals = deals.filter((d) => {
    if (d.status !== 'won') return false
    if (!d.won_time && !d.close_time) return true
    const wonDate = new Date(d.won_time || d.close_time)
    return wonDate >= periodStart
  })

  const lostDeals = deals.filter((d) => {
    if (d.status !== 'lost') return false
    if (!d.lost_time && !d.close_time) return true
    const lostDate = new Date(d.lost_time || d.close_time)
    return lostDate >= periodStart
  })

  const openDeals = deals.filter((d) => d.status === 'open')

  const prevWonDeals = deals.filter((d) => {
    if (d.status !== 'won') return false
    if (!d.won_time && !d.close_time) return false
    const dt = new Date(d.won_time || d.close_time)
    return dt >= prevPeriodStart && dt < periodStart
  })
  const prevLostDeals = deals.filter((d) => {
    if (d.status !== 'lost') return false
    if (!d.lost_time && !d.close_time) return false
    const dt = new Date(d.lost_time || d.close_time)
    return dt >= prevPeriodStart && dt < periodStart
  })

  const newThisWeek = openDeals.filter((d) => d.add_time && new Date(d.add_time) >= weekAgo).length

  const converted = wonDeals.length
  const lost = lostDeals.length
  const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const conversionRate = converted + lost > 0
    ? Math.round((converted / (converted + lost)) * 1000) / 10
    : 0
  const ticketMedio = converted > 0 ? revenue / converted : 0

  const prevRevenue = prevWonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const prevConverted = prevWonDeals.length
  const prevLost = prevLostDeals.length
  const prevConversionRate = prevConverted + prevLost > 0
    ? Math.round((prevConverted / (prevConverted + prevLost)) * 1000) / 10
    : 0
  const revenueDelta = revenue - prevRevenue
  const conversionRateDelta = Math.round((conversionRate - prevConversionRate) * 10) / 10

  const acts = activities || []
  const actSummary = { calls: 0, emails: 0, meetings: 0, total: acts.length }
  acts.forEach((a) => {
    const t = (a.type || '').toLowerCase()
    if (t.includes('call') || t.includes('ligação') || t.includes('liga')) actSummary.calls++
    else if (t.includes('email') || t.includes('e-mail')) actSummary.emails++
    else if (t.includes('meeting') || t.includes('reunião') || t.includes('reuniao')) actSummary.meetings++
  })

  const dailyVolume = []
  for (let i = periodDays; i >= 0; i--) {
    const d = new Date(now.getTime() - i * MS_PER_DAY)
    dailyVolume.push({ date: d.toISOString().slice(0, 10), count: 0, daysAgo: -i })
  }
  acts.forEach((a) => {
    const date = (a.due_date || a.add_time || '').slice(0, 10)
    const entry = dailyVolume.find((v) => v.date === date)
    if (entry) entry.count++
  })

  const channels = [
    { name: 'ligações', count: actSummary.calls },
    { name: 'reuniões', count: actSummary.meetings },
    { name: 'e-mails', count: actSummary.emails },
  ].sort((a, b) => b.count - a.count)
  const concentration = actSummary.total > 0
    ? { channel: channels[0].name, pct: Math.round((channels[0].count / actSummary.total) * 1000) / 10 }
    : null

  const cadenceFrequency = openDeals.length > 0
    ? Math.round((actSummary.total / openDeals.length) * 10) / 10
    : 0

  let lastActivityDaysAgo = null
  acts.forEach((a) => {
    const d = a.due_date || a.add_time
    if (d) {
      const days = Math.floor((now - new Date(d)) / MS_PER_DAY)
      if (lastActivityDaysAgo === null || days < lastActivityDaysAgo) lastActivityDaysAgo = days
    }
  })

  const leadsNoContact7d = openDeals.filter((d) => {
    const lastAct = d.last_activity_date || d.update_time
    if (!lastAct) return true
    return Math.floor((now - new Date(lastAct)) / MS_PER_DAY) > 7
  }).length

  const programCfg = programFilter ? PROGRAMS.find((p) => p.id === programFilter) : null
  const stages = programCfg ? programCfg.stages : PROGRAMS.flatMap((p) => p.stages)
  const stageMap = {}
  stages.forEach((s) => { if (!stageMap[s.id]) stageMap[s.id] = { name: s.name, count: 0, value: 0 } })
  openDeals.forEach((d) => {
    if (stageMap[d.stage_id]) {
      stageMap[d.stage_id].count++
      stageMap[d.stage_id].value += d.value || 0
    }
  })
  const funnelData = Object.values(stageMap).filter((s) => s.count > 0 || true)

  // ── Portfolio / Carteira ativa ──
  const CANONICAL_ORDER = ['Cliente Potencial', 'Qualificado', 'Em Negociação', 'Inscrito', 'Entrevista', 'Efetivado']
  const portfolioByName = {}
  Object.values(stageMap).forEach(({ name, count, value }) => {
    if (!portfolioByName[name]) portfolioByName[name] = { name, count: 0, value: 0 }
    portfolioByName[name].count += count
    portfolioByName[name].value += value
  })
  const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const orderedNames = programCfg
    ? programCfg.stages.map((s) => s.name)
    : CANONICAL_ORDER.filter((n) => portfolioByName[n])
  const portfolioData = orderedNames.map((n) => {
    const pd = portfolioByName[n] || { name: n, count: 0, value: 0 }
    return {
      name: pd.name,
      count: pd.count,
      value: pd.value,
      pctCount: openDeals.length > 0 ? Math.round((pd.count / openDeals.length) * 100) : 0,
      pctValue: totalOpenValue > 0 ? Math.round((pd.value / totalOpenValue) * 100) : 0,
    }
  })
  const topValueStage = [...portfolioData].sort((a, b) => b.value - a.value)[0] || null
  const lastStagePortfolio = portfolioData[portfolioData.length - 1]
  const expectedConversion = lastStagePortfolio ? lastStagePortfolio.count : 0

  const mapDeal = (d) => {
    const addDate = d.add_time ? new Date(d.add_time) : null
    const daysInFunnel = addDate ? Math.floor((now - addDate) / MS_PER_DAY) : null
    const lastUpdate = d.update_time || d.add_time
    const idle = lastUpdate ? Math.floor((now - new Date(lastUpdate)) / MS_PER_DAY) : 999
    const mo = addDate ? addDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : ''
    return {
      id: d.id, title: d.title, status: d.status,
      value: d.value || 0, daysInFunnel, idle,
      stageName: stageMap[d.stage_id]?.name || '—',
      addLabel: mo ? `Lead inscrito em ${mo}` : '',
    }
  }
  const mappedOpen = openDeals.map(mapDeal).sort((a, b) => (a.daysInFunnel || 0) - (b.daysInFunnel || 0))
  const mappedWon = wonDeals.map(mapDeal).sort((a, b) => (b.daysInFunnel || 0) - (a.daysInFunnel || 0))
  const mappedLost = lostDeals.map(mapDeal).sort((a, b) => (b.daysInFunnel || 0) - (a.daysInFunnel || 0))
  const mappedStagnant = mappedOpen.filter((d) => d.idle > 14).sort((a, b) => b.idle - a.idle)

  const conversionDaysList = wonDeals
    .filter((d) => d.add_time && (d.won_time || d.close_time))
    .map((d) => Math.floor((new Date(d.won_time || d.close_time) - new Date(d.add_time)) / MS_PER_DAY))
  const avgConversionDays = conversionDaysList.length > 0
    ? Math.round(conversionDaysList.reduce((a, b) => a + b, 0) / conversionDaysList.length)
    : null

  const stageTimesRaw = {}
  wonDeals.forEach((d) => {
    const times = stageTimesMap?.[d.id]
    if (!times) return
    Object.entries(times).forEach(([sid, secs]) => {
      if (!stageTimesRaw[sid]) stageTimesRaw[sid] = []
      stageTimesRaw[sid].push(secs)
    })
  })
  const stageAvgDays = programCfg
    ? programCfg.stages.map((s) => {
        const arr = stageTimesRaw[s.id] || []
        const avg = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
        return { id: s.id, name: s.name, days: Math.round(avg / 86400) }
      })
    : []
  const maxStageDays = stageAvgDays.length > 0 ? Math.max(...stageAvgDays.map((s) => s.days)) : 0
  const avgAllStages = stageAvgDays.length > 0
    ? Math.round(stageAvgDays.reduce((sum, s) => sum + s.days, 0) / stageAvgDays.length)
    : 0
  const gargaloStage = stageAvgDays.find((s) => s.days === maxStageDays && s.days > avgAllStages) || null
  const gargalo = gargaloStage
    ? { name: gargaloStage.name, days: gargaloStage.days, delta: gargaloStage.days - avgAllStages }
    : null

  const stagnantValue = mappedStagnant.reduce((sum, d) => sum + d.value, 0)

  return {
    converted,
    lost,
    revenue,
    conversionRate,
    ticketMedio,
    revenueDelta,
    conversionRateDelta,
    newThisWeek,
    openDeals: openDeals.length,
    pipelineValue: openDeals.reduce((sum, d) => sum + (d.value || 0), 0),
    activities: actSummary,
    dailyVolume,
    concentration,
    cadence: { frequency: cadenceFrequency, lastActivityDaysAgo, leadsNoContact7d },
    funnelData: programCfg
      ? programCfg.stages.map((s) => ({ name: s.name, count: stageMap[s.id]?.count || 0 }))
      : [],
    portfolio: {
      stages: portfolioData,
      totalCount: openDeals.length,
      totalValue: totalOpenValue,
      topValueStage: topValueStage ? { name: topValueStage.name, pct: topValueStage.pctValue } : null,
      expectedConversion,
    },
    dealsByStatus: { open: mappedOpen, won: mappedWon, lost: mappedLost, stagnant: mappedStagnant },
    velocity: { avgConversionDays, stageAvgDays, maxStageDays, gargalo, stagnantCount: mappedStagnant.length, stagnantValue },
  }
}

export function useSellerData() {
  const [allDeals, setAllDeals] = useState([])
  const [activitiesMap, setActivitiesMap] = useState({})
  const [avatarMap, setAvatarMap] = useState({})
  const [stageTimesMap, setStageTimesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedSeller, setSelectedSeller] = useState(SELLERS[0].id)
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
      console.error('[useSellerData] Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [periodDays])

  useEffect(() => { loadData() }, [loadData])

  const seller = SELLERS.find((s) => s.id === selectedSeller)
  const avatarUrl = seller ? avatarMap[seller.id] || null : null
  const metrics = !loading && seller
    ? computeSellerMetrics(selectedSeller, allDeals, activitiesMap[selectedSeller], periodDays, selectedProgram || null, stageTimesMap)
    : null

  const rankingData = !loading
    ? SELLERS.map((s) => {
        const m = computeSellerMetrics(s.id, allDeals, activitiesMap[s.id], periodDays, selectedProgram || null, stageTimesMap)
        return { ...s, converted: m.converted, revenue: m.revenue, conversionRate: m.conversionRate, cadenceFreq: m.cadence.frequency, avgConvDays: m.velocity.avgConversionDays }
      }).sort((a, b) => b.converted - a.converted)
    : []

  const currentRank = rankingData.findIndex((s) => s.id === selectedSeller) + 1
  const teamBenchmark = rankingData.length > 0
    ? Math.round((rankingData.reduce((sum, s) => sum + s.conversionRate, 0) / rankingData.length) * 10) / 10
    : 0
  const teamCadence = rankingData.length > 0
    ? Math.round((rankingData.reduce((sum, s) => sum + s.cadenceFreq, 0) / rankingData.length) * 10) / 10
    : 0
  const teamConvDaysArr = rankingData.filter((s) => s.avgConvDays != null).map((s) => s.avgConvDays)
  const teamConversionDays = teamConvDaysArr.length > 0
    ? Math.round(teamConvDaysArr.reduce((a, b) => a + b, 0) / teamConvDaysArr.length)
    : null

  return {
    sellers: SELLERS,
    programs: PROGRAMS,
    loading,
    seller,
    avatarUrl,
    metrics,
    currentRank,
    teamBenchmark,
    teamCadence,
    teamConversionDays,
    selectedSeller,
    setSelectedSeller,
    selectedProgram,
    setSelectedProgram,
    periodDays,
    setPeriodDays,
  }
}
