import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchAllDealsByPipeline, fetchUsers } from '../services/pipedriveApi.js'
import { PROGRAMS_B2B, REFRESH_INTERVAL_MINUTES } from '../config/pipedrive.js'

// Calcula o intervalo [início, fim) do ano de calendário
export function getPeriodRange(year) {
  return [new Date(year, 0, 1), new Date(year + 1, 0, 1)]
}

function inRange(dateStr, [start, end]) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= start && d < end
}

// Processa os deals de um programa B2B: funil sempre no estado atual,
// receita/conversão/alertas/vendedores filtrados pelo ano selecionado.
function processB2BProgram(program, deals, range, userMap) {
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

  const periodRevenueGoal = program.revenueGoal || 0
  const periodGoal = program.goal ?? null
  const goalPercent = periodRevenueGoal > 0 ? Math.min(100, (totalWonValue / periodRevenueGoal) * 100) : 0
  const remaining = Math.max(0, periodRevenueGoal - totalWonValue)

  // --- Alertas (mesma lógica de SLA do Comando B2C) ---
  const now = new Date()
  const msPerDay = 86400000
  const idleDays = (deal) => {
    const last = deal.update_time || deal.add_time
    return last ? Math.floor((now - new Date(last)) / msPerDay) : 999
  }

  const earlyStageIds = new Set(program.stages.slice(0, 2).map((s) => s.id))
  const advancedStageIds = new Set(program.stages.slice(2).map((s) => s.id))

  const critico = openDeals.filter((d) => idleDays(d) > 14)
  const pendencia = openDeals.filter((d) => {
    const days = idleDays(d)
    return earlyStageIds.has(d.stage_id) && days >= 3 && days <= 14
  })
  const oportunidade = openDeals.filter((d) => advancedStageIds.has(d.stage_id))

  const stageNameMap = new Map(program.stages.map((s) => [s.id, s.name]))
  const toAlertDeal = (deal) => ({
    id: deal.id,
    title: deal.title,
    idle: idleDays(deal),
    stageId: deal.stage_id,
    stageName: stageNameMap.get(deal.stage_id) || '—',
    value: deal.value || 0,
  })
  const criticoDeals = critico.map(toAlertDeal).sort((a, b) => b.idle - a.idle)
  const pendenciaDeals = pendencia.map(toAlertDeal).sort((a, b) => b.idle - a.idle)
  const oportunidadeDeals = oportunidade.map(toAlertDeal).sort((a, b) => b.value - a.value)

  const goalPct = Math.round(goalPercent)
  let marcoText = null
  if (goalPct >= 100) marcoText = 'Meta batida!'
  else if (goalPct >= 90) marcoText = `${goalPct}% da meta · quase lá`
  else if (goalPct >= 75) marcoText = `${goalPct}% da meta anual atingida`
  else if (goalPct >= 50) marcoText = 'Metade da meta anual atingida'
  else marcoText = `${goalPct}% da meta anual atingida`

  const alerts = {
    critico: { count: critico.length, text: critico.length > 0 ? `${critico.length} ${critico.length === 1 ? 'lead' : 'leads'} sem movimentação há +14 dias` : 'Nenhum lead crítico', deals: criticoDeals },
    pendencia: { count: pendencia.length, text: pendencia.length > 0 ? `${pendencia.length} ${pendencia.length === 1 ? 'lead aguarda' : 'leads aguardam'} follow-up` : 'Nenhuma pendência', deals: pendenciaDeals },
    oportunidade: { count: oportunidade.length, text: oportunidade.length > 0 ? `${oportunidade.length} ${oportunidade.length === 1 ? 'lead pronto' : 'leads prontos'} para fechar` : 'Nenhuma oportunidade avançada', deals: oportunidadeDeals },
    marco: { text: marcoText },
  }

  // --- Performance por vendedor ---
  const sellerMap = {}
  const ensureSeller = (sellerId) => {
    const user = userMap[sellerId]
    if (!sellerMap[sellerId]) {
      sellerMap[sellerId] = {
        id: sellerId,
        name: user?.name || 'Sem responsável',
        avatarUrl: user?.avatarUrl || null,
        converted: 0,
        convertedValue: 0,
        active: 0,
        lastActivity: null,
      }
    }
    return sellerMap[sellerId]
  }
  const touchActivity = (seller, deal) => {
    const dealUpdate = deal.update_time || deal.add_time
    if (dealUpdate && (!seller.lastActivity || dealUpdate > seller.lastActivity)) {
      seller.lastActivity = dealUpdate
    }
  }
  openDeals.forEach((deal) => {
    const seller = ensureSeller(deal.owner_id)
    seller.active++
    touchActivity(seller, deal)
  })
  wonInPeriod.forEach((deal) => {
    const seller = ensureSeller(deal.owner_id)
    seller.converted++
    seller.convertedValue += deal.value || 0
    touchActivity(seller, deal)
  })

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
    periodRevenueGoal,
    periodGoal,
    goalPercent,
    remaining,
    alerts,
    sellers: Object.values(sellerMap).sort((a, b) => b.converted - a.converted),
  }
}

export function useB2BDashboardData(year) {
  const [rawDeals, setRawDeals] = useState(null)
  const [userMap, setUserMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)
      const [results, users] = await Promise.all([
        Promise.all(PROGRAMS_B2B.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
        fetchUsers(),
      ])
      const byId = {}
      PROGRAMS_B2B.forEach((p, idx) => {
        byId[p.id] = results[idx]
      })
      const map = {}
      ;(users || []).forEach((u) => {
        const pics = u.picture_id?.pictures
        const avatarUrl = pics?.['128'] || pics?.['512'] || pics?.['original'] || u.icon_url || null
        map[u.id] = { name: u.name, avatarUrl }
      })
      setRawDeals(byId)
      setUserMap(map)
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

  // Agregação por ano: recalcula na hora ao trocar o ano, sem rebater na API
  const data = useMemo(() => {
    if (!rawDeals) return null

    const range = getPeriodRange(year)
    const programs = PROGRAMS_B2B.map((program) => {
      const deals = rawDeals[program.id] || []
      const metrics = processB2BProgram(program, deals, range, userMap)
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

    // Mapa global de vendedores (união dos 4 programas), formato esperado pelo TeamCard
    const globalSellerMap = {}
    programs.forEach((program) => {
      program.sellers.forEach((seller) => {
        if (!globalSellerMap[seller.id]) {
          globalSellerMap[seller.id] = {
            id: seller.id,
            name: seller.name,
            avatarUrl: seller.avatarUrl,
            programs: {},
          }
        }
        globalSellerMap[seller.id].programs[program.id] = {
          converted: seller.converted,
          convertedValue: seller.convertedValue,
          active: seller.active,
          lastActivity: seller.lastActivity,
        }
      })
    })

    return { programs, totals, sellers: Object.values(globalSellerMap) }
  }, [rawDeals, userMap, year])

  return { data, loading, error, lastUpdated, refresh: fetchAll }
}
