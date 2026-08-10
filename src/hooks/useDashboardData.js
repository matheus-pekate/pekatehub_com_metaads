import { useState, useEffect, useCallback } from 'react'
import { fetchAllDealsByPipeline, fetchUsers, fetchDealActivitySignals, fetchActivitiesByIds } from '../services/pipedriveApi.js'
import { PROGRAMS, REFRESH_INTERVAL_MINUTES } from '../config/pipedrive.js'

function toLocalDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Processa os deals de um programa e retorna métricas calculadas
function processProgramDeals(program, deals, userMap, activitySignals = {}, activitiesById = {}) {
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

  // Ticket médio real: total ganho dividido pelo número de conversões (não é o "price" configurado)
  const avgTicket = converted > 0 ? totalWonValue / converted : 0
  // Desconto médio: quanto o ticket médio real ficou abaixo do preço cheio do programa
  const discountPct = program.price > 0 && avgTicket > 0 ? ((program.price - avgTicket) / program.price) * 100 : 0

  // Meta de alunos dinâmica: antes da 1ª venda usa o goal fixo configurado (estimativa inicial).
  // A partir da 1ª venda, recalcula quantos alunos são necessários pra bater a meta financeira
  // usando o ticket médio REAL (já reflete o desconto dado) em vez do price de tabela.
  const dynamicGoal = (converted > 0 && avgTicket > 0 && program.revenueGoal > 0)
    ? Math.ceil(program.revenueGoal / avgTicket)
    : program.goal

  // Forecast: leads open de Em Negociação em diante
  const forecastCount = program.stages
    .slice(2)
    .reduce((acc, s) => acc + (stageMap[s.id]?.count || 0), 0)
  const forecast = forecastCount * (program.price || 0)

  // Taxa de conversão: ganhos / total criados
  const totalDealsCount = filtered.length
  const conversionRate = totalDealsCount > 0 ? (converted / totalDealsCount) * 100 : 0

  // --- Alertas ---
  const now = new Date()
  const msPerDay = 86400000
  const openDeals = filtered.filter((d) => d.status === 'open')

  // Performance por vendedor — considera deals open (em andamento) e won (convertidos).
  // Usa wonDeals (já filtrado por program.wonThisYear) em vez de reaplicar status === 'won'
  // sobre `filtered`, senão programas com wonThisYear (ex: PDD Avulso) somam anos anteriores
  // no valor convertido do vendedor, inflando o total muito acima do totalWonValue do programa.
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
  wonDeals.forEach((deal) => {
    const seller = ensureSeller(deal.owner_id)
    seller.converted++
    seller.convertedValue += deal.value || 0
    touchActivity(seller, deal)
  })

  // Dias parado: se o negócio tem uma atividade agendada cuja data ainda não
  // passou, não está parado (0 dias) — já tem próximo passo marcado. Só volta
  // a contar (a partir da última atividade de fato concluída) quando essa
  // atividade vence sem ser feita, ou quando nunca houve nenhuma agendada.
  const todayStr = toLocalDateStr(now)
  const idleDays = (deal) => {
    const signal = activitySignals[deal.id]
    const nextActivity = signal?.nextActivityId ? activitiesById[signal.nextActivityId] : null
    if (nextActivity?.due_date && nextActivity.due_date >= todayStr) return 0

    const lastActivity = signal?.lastActivityId ? activitiesById[signal.lastActivityId] : null
    const lastDoneAt = lastActivity?.marked_as_done_time || lastActivity?.due_date || null
    const last = lastDoneAt || deal.update_time || deal.add_time
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

  // Detalhe dos leads por trás de cada alerta (usado no modal ao clicar num alerta)
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

  const daysToStart = program.startDate
    ? Math.ceil((new Date(program.startDate + 'T00:00:00') - now) / msPerDay)
    : null

  const goalPct = dynamicGoal > 0 ? Math.round((converted / dynamicGoal) * 100) : 0
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
    critico: { count: critico.length, text: critico.length > 0 ? `${critico.length} ${critico.length === 1 ? 'lead' : 'leads'} sem movimentação há +14 dias` : 'Nenhum lead crítico', deals: criticoDeals },
    pendencia: { count: pendencia.length, text: pendencia.length > 0 ? `${pendencia.length} ${pendencia.length === 1 ? 'lead aguarda' : 'leads aguardam'} follow-up` : 'Nenhuma pendência', deals: pendenciaDeals },
    oportunidade: { count: oportunidade.length, text: oportunidade.length > 0 ? `${oportunidade.length} ${oportunidade.length === 1 ? 'lead pronto' : 'leads prontos'} para fechar` : 'Nenhuma oportunidade avançada', deals: oportunidadeDeals },
    marco: { text: marcoText || 'Sem marcos próximos' },
  }

  return {
    stagesData,
    converted,
    convertedValue,
    totalWonValue,
    avgTicket,
    discountPct,
    dynamicGoal,
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
      const [programDealsResults, users, activitySignalsResults] = await Promise.all([
        Promise.all(PROGRAMS.map((p) => fetchAllDealsByPipeline(p.pipelineId))),
        fetchUsers(),
        // Sinais de "próxima atividade agendada" / "última concluída" (só a
        // API v1 expõe isso) — se essa busca falhar, cai no fallback antigo
        // (deal.update_time) em vez de quebrar o dashboard inteiro.
        Promise.all(PROGRAMS.map((p) => fetchDealActivitySignals(p.pipelineId).catch(() => ({})))),
      ])

      const userMap = {}
      ;(users || []).forEach((u) => {
        const pics = u.picture_id?.pictures
        const avatarUrl = pics?.['128'] || pics?.['512'] || pics?.['original'] || u.icon_url || null
        userMap[u.id] = { name: u.name, avatarUrl }
      })

      // Junta os ids de atividade (próxima + última) de todos os programas
      // numa única leva de busca em lote, em vez de repetir por programa.
      const allActivityIds = new Set()
      activitySignalsResults.forEach((signals) => {
        Object.values(signals).forEach(({ nextActivityId, lastActivityId }) => {
          if (nextActivityId) allActivityIds.add(nextActivityId)
          if (lastActivityId) allActivityIds.add(lastActivityId)
        })
      })
      const activitiesById = allActivityIds.size > 0
        ? await fetchActivitiesByIds([...allActivityIds]).catch(() => ({}))
        : {}

      const programs = PROGRAMS.map((program, idx) => {
        const deals = programDealsResults[idx]
        const metrics = processProgramDeals(program, deals, userMap, activitySignalsResults[idx], activitiesById)
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
