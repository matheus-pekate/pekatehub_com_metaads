import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMetaAdsSnapshot, fetchWonDeals, fetchLostDeals, fetchOpenDeals, fetchLeadsList } from '../services/metaAdsApi'
import { PROGRAMS, REFRESH_INTERVAL_MINUTES } from '../config/metaAds'

const MS_PER_DAY = 86400000

// Total/último dia/última semana derivam da MESMA lista de leads que o modal
// mostra ao clicar (Pipedrive) — não do agregado do Facebook Ads, que mede
// outra coisa (submissões de formulário na plataforma do Meta) e nunca bate
// 1:1 com o que de fato virou um registro no Pipedrive.
function computeLeadCounts(leads) {
  const now = Date.now()
  const last1Day = leads.filter((l) => l.add_time && now - new Date(l.add_time).getTime() <= MS_PER_DAY).length
  const last7Days = leads.filter((l) => l.add_time && now - new Date(l.add_time).getTime() <= 7 * MS_PER_DAY).length
  return { total: leads.length, last1Day, last7Days }
}

function toProgramView(apiProgram, configProgram, wonProgram, lostProgram, openProgram, leadsProgram) {
  const ads = apiProgram?.ads ?? []
  const leads = leadsProgram?.leads ?? []
  const leadCounts = computeLeadCounts(leads)
  return {
    id: configProgram.id,
    name: configProgram.name,
    accentColor: configProgram.accentColor,
    duration: configProgram.duration,
    hasActiveCampaigns: ads.length > 0,
    totalLeads: leadCounts.total,
    totalSpend: apiProgram.totalSpend ?? 0,
    cplMedio: apiProgram.cplMedio ?? null,
    totalReach: apiProgram.totalReach ?? 0,
    leadsLast1Day: leadCounts.last1Day,
    leadsLast7Days: leadCounts.last7Days,
    bestAd: ads[0] ?? null,
    ads,
    totalWon: wonProgram?.totalWon ?? 0,
    wonDeals: wonProgram?.deals ?? [],
    totalLost: lostProgram?.totalLost ?? 0,
    lostDeals: lostProgram?.deals ?? [],
    lostReasons: lostProgram?.reasonBreakdown ?? [],
    totalOpen: openProgram?.totalOpen ?? 0,
    openDeals: openProgram?.deals ?? [],
    leadsList: leads,
  }
}

function emptyProgramView(program, wonProgram, lostProgram, openProgram, leadsProgram) {
  const leads = leadsProgram?.leads ?? []
  const leadCounts = computeLeadCounts(leads)
  return {
    id: program.id,
    name: program.name,
    accentColor: program.accentColor,
    duration: program.duration,
    hasActiveCampaigns: false,
    totalLeads: leadCounts.total,
    totalSpend: 0,
    cplMedio: null,
    totalReach: 0,
    leadsLast1Day: leadCounts.last1Day,
    leadsLast7Days: leadCounts.last7Days,
    bestAd: null,
    ads: [],
    totalWon: wonProgram?.totalWon ?? 0,
    wonDeals: wonProgram?.deals ?? [],
    totalLost: lostProgram?.totalLost ?? 0,
    lostDeals: lostProgram?.deals ?? [],
    lostReasons: lostProgram?.reasonBreakdown ?? [],
    totalOpen: openProgram?.totalOpen ?? 0,
    openDeals: openProgram?.deals ?? [],
    leadsList: leads,
  }
}

export function useMetaAdsData() {
  const [data, setData] = useState(() => PROGRAMS.map(emptyProgramView))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const dataRef = useRef(data)

  const load = useCallback(async () => {
    try {
      const payload = await fetchMetaAdsSnapshot()
      // Convertidos/Ganhos, Perdidos, Em Aberto e Leads são dados complementares (fonte
      // separada) — se esses webhooks falharem, não pode derrubar o resto do dashboard
      // que já funciona.
      const [wonPrograms, lostPrograms, openPrograms, leadsPrograms] = await Promise.all([
        fetchWonDeals().catch(() => []),
        fetchLostDeals().catch(() => []),
        fetchOpenDeals().catch(() => []),
        fetchLeadsList().catch(() => []),
      ])
      const wonById = new Map(wonPrograms.map((p) => [p.program_id, p]))
      const lostById = new Map(lostPrograms.map((p) => [p.program_id, p]))
      const openById = new Map(openPrograms.map((p) => [p.program_id, p]))
      const leadsById = new Map(leadsPrograms.map((p) => [p.program_id, p]))
      const byId = new Map(payload.map((p) => [p.program_id, p]))
      const next = PROGRAMS.map((program) => {
        const wonProgram = wonById.get(program.id)
        const lostProgram = lostById.get(program.id)
        const openProgram = openById.get(program.id)
        const leadsProgram = leadsById.get(program.id)
        return byId.has(program.id)
          ? toProgramView(byId.get(program.id), program, wonProgram, lostProgram, openProgram, leadsProgram)
          : emptyProgramView(program, wonProgram, lostProgram, openProgram, leadsProgram)
      })
      dataRef.current = next
      setData(next)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message || 'Falha ao carregar dados do Meta Ads')
      // mantém o último dado bom na tela (TV passiva não pode ficar em branco)
      setData(dataRef.current)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MINUTES * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  return { data, loading, error, lastUpdated, refresh: load }
}
