import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMetaAdsSnapshot, fetchWonDeals, fetchLostDeals, fetchLeadsList } from '../services/metaAdsApi'
import { PROGRAMS, REFRESH_INTERVAL_MINUTES } from '../config/metaAds'

function toProgramView(apiProgram, configProgram, wonProgram, lostProgram, leadsProgram) {
  const ads = apiProgram?.ads ?? []
  return {
    id: configProgram.id,
    name: configProgram.name,
    accentColor: configProgram.accentColor,
    duration: configProgram.duration,
    hasActiveCampaigns: ads.length > 0,
    totalLeads: apiProgram.totalLeads ?? 0,
    totalSpend: apiProgram.totalSpend ?? 0,
    cplMedio: apiProgram.cplMedio ?? null,
    totalReach: apiProgram.totalReach ?? 0,
    leadsLast1Day: apiProgram.leadsLast1Day ?? 0,
    leadsLast7Days: apiProgram.leadsLast7Days ?? 0,
    bestAd: ads[0] ?? null,
    ads,
    totalWon: wonProgram?.totalWon ?? 0,
    wonDeals: wonProgram?.deals ?? [],
    totalLost: lostProgram?.totalLost ?? 0,
    lostDeals: lostProgram?.deals ?? [],
    lostReasons: lostProgram?.reasonBreakdown ?? [],
    leadsList: leadsProgram?.leads ?? [],
  }
}

function emptyProgramView(program, wonProgram, lostProgram, leadsProgram) {
  return {
    id: program.id,
    name: program.name,
    accentColor: program.accentColor,
    duration: program.duration,
    hasActiveCampaigns: false,
    totalLeads: 0,
    totalSpend: 0,
    cplMedio: null,
    totalReach: 0,
    leadsLast1Day: 0,
    leadsLast7Days: 0,
    bestAd: null,
    ads: [],
    totalWon: wonProgram?.totalWon ?? 0,
    wonDeals: wonProgram?.deals ?? [],
    totalLost: lostProgram?.totalLost ?? 0,
    lostDeals: lostProgram?.deals ?? [],
    lostReasons: lostProgram?.reasonBreakdown ?? [],
    leadsList: leadsProgram?.leads ?? [],
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
      // Convertidos/Ganhos, Perdidos e Leads são dados complementares (fonte separada) —
      // se esses webhooks falharem, não pode derrubar o resto do dashboard que já funciona.
      const [wonPrograms, lostPrograms, leadsPrograms] = await Promise.all([
        fetchWonDeals().catch(() => []),
        fetchLostDeals().catch(() => []),
        fetchLeadsList().catch(() => []),
      ])
      const wonById = new Map(wonPrograms.map((p) => [p.program_id, p]))
      const lostById = new Map(lostPrograms.map((p) => [p.program_id, p]))
      const leadsById = new Map(leadsPrograms.map((p) => [p.program_id, p]))
      const byId = new Map(payload.map((p) => [p.program_id, p]))
      const next = PROGRAMS.map((program) => {
        const wonProgram = wonById.get(program.id)
        const lostProgram = lostById.get(program.id)
        const leadsProgram = leadsById.get(program.id)
        return byId.has(program.id)
          ? toProgramView(byId.get(program.id), program, wonProgram, lostProgram, leadsProgram)
          : emptyProgramView(program, wonProgram, lostProgram, leadsProgram)
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
