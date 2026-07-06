import { useState, useEffect, useCallback } from 'react'
import { fetchAllDealsByPipeline, fetchUsers } from '../services/pipedriveApi.js'
import { PROGRAMS, REFRESH_INTERVAL_MINUTES } from '../config/pipedrive.js'

// Processa os deals de um programa e retorna métricas calculadas
function processProgramDeals(program, deals, userMap) {
  // Filtra todos os deals pela turma quando configurado
  let filtered = deals
  if (program.convertedFilter) {
    const { customField, value } = program.convertedFilter
    filtered = deals.filter((d) => d.custom_fields?.[customField] === value)
  }

  const stageMap = {}
  program.stages.forEach((s) => {
    stageMap[s.id] = { ...s, count: 0, deals: [] }
  })

  filtered.forEach((deal) => {
    if (deal.status !== 'open') return
    if (stageMap[deal.stage_id]) {
      stageMap[deal.stage_id].count++
      stageMap[deal.stage_id].deals.push(deal)
    }
  })

  const stagesData = program.stages.map((s) => stageMap[s.id])

  const currentYear = new Date().getFullYear()
  const wonDeals = filtered.filter((d) => {
    if (d.status !== 'won') return false
    if (program.wonThisYear) {
      const wonYear = d.won_time ? new Date(d.won_time).getFullYear() : null
      return wonYear === currentYear
    }
    return true
  })
  const converted = wonDeals.length
  const convertedValue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0)

  // Total de deals ativos no funil (apenas status open)
  const totalActive = filtered.filter((d) => d.status === 'open').length

  // Total ganho em R$: soma do valor real de cada negócio fechado (nem todos fecham pelo mesmo preço)
  const totalWonValue = convertedValue

  // Forecast: leads open de Em Negociação em diante
  const forecastCount = program.stages
    .slice(2)
    .reduce((acc, s) => acc + (stageMap[s.id]?.count || 0), 0)
  const forecast = forecastCount * (program.price || 0)

  // Taxa de conversão: ganhos / total criados
  const totalDealsCount = filtered.length
  const conversionRate = totalDealsCount > 0 ? (converted / totalDealsCount) * 100 : 0

  // Performance por vendedor — considera deals open (em andamento) e won (convertidos)
  const sellerMap = {}
  filtered.forEach((deal) => {
    if (deal.status !== 'open' && deal.status !== 'won') return
    const sellerId = deal.owner_id
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
    if (deal.status === 'open') {
      sellerMap[sellerId].active++
    } else if (deal.status === 'won') {
      sellerMap[sellerId].converted++
      sellerMap[sellerId].convertedValue += deal.value || 0
    }
    const dealUpdate = deal.update_time || deal.add_time
    if (
      dealUpdate &&
      (!sellerMap[sellerId].lastActivity || dealUpdate > sellerMap[sellerId].lastActivity)
    ) {
      sellerMap[sellerId].lastActivity = dealUpdate
    }
  })

  // --- Alertas ---
  const now = new Date()
  const msPerDay = 86400000
  const openDeals = filtered.filter((d) => d.status === 'open')

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

  const daysToStart = program.startDate
    ? Math.ceil((new Date(program.startDate + 'T00:00:00') - now) / msPerDay)
    : null

  const goalPct = program.goal > 0 ? Math.round((converted / program.goal) * 100) : 0
  let marcoText = null
  if (goalPct >= 100) marcoText = 'Meta batida!'
  else if (goalPct >= 90) marcoText = `${goalPct}% da meta · quase lá`
  else if (goalPct >= 75) marcoText = `${goalPct}% da meta atingida`
  else if (goalPct >= 50) marcoText = `Metade da meta atingida`
  if (daysToStart != null && daysToStart > 0) {
    marcoText = marcoText
      ? `${marcoText} · ${daysToStart}d para a virada`
      : `${daysToStart} dias para a virada`
  }

  const alerts = {
    critico: { count: critico.length, text: critico.length > 0 ? `${critico.length} ${critico.length === 1 ? 'lead' : 'leads'} sem movimentação há +14 dias` : 'Nenhum lead crítico' },
    pendencia: { count: pendencia.length, text: pendencia.length > 0 ? `${pendencia.length} ${pendencia.length === 1 ? 'lead aguarda' : 'leads aguardam'} follow-up` : 'Nenhuma pendência' },
    oportunidade: { count: oportunidade.length, text: oportunidade.length > 0 ? `${oportunidade.length} ${oportunidade.length === 1 ? 'lead pronto' : 'leads prontos'} para fechar` : 'Nenhuma oportunidade avançada' },
    marco: { text: marcoText || 'Sem marcos próximos' },
  }

  return {
    stagesData,
    converted,
    convertedValue,
    totalWonValue,
    forecast,
    forecastCount,
    conversionRate,
    totalDealsCount,
    totalActive,
    goalPercent: Math.min(100, goalPct),
    sellers: Object.values(sellerMap).sort((a, b) => b.converted - a.converted),
    alerts,
  }
}

export function useDashboardData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)

      // Busca todos os programas em paralelo
      const [programDealsResults, users] = await Promise.all([
        Promise.all(PROGRAMS.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
        fetchUsers(),
      ])

      const userMap = {}
      ;(users || []).forEach((u) => {
        const pics = u.picture_id?.pictures
        const avatarUrl = pics?.['128'] || pics?.['512'] || pics?.['original'] || u.icon_url || null
        userMap[u.id] = { name: u.name, avatarUrl }
      })

      const programs = PROGRAMS.map((program, idx) => {
        const deals = programDealsResults[idx]
        const metrics = processProgramDeals(program, deals, userMap)
        return {
          ...program,
          ...metrics,
          deals,
        }
      })

      // Constrói mapa global de vendedores (união de todos os programas)
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
            goal: Math.round(program.goal / 3),
            lastActivity: seller.lastActivity,
          }
        })
      })

      setData({
        programs,
        sellers: Object.values(globalSellerMap),
      })
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

  return { data, loading, error, lastUpdated, refresh: fetchAll }
}
