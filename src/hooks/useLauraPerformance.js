import { useEffect, useState } from 'react'
import { fetchLauraPerformance, fetchWonDeals } from '../services/metaAdsApi'
import { REFRESH_INTERVAL_MINUTES } from '../config/metaAds'

export function useLauraPerformance() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      // Ganhos é dado complementar (mesma fonte usada no Comando Meta Ads) —
      // se esse webhook falhar, não pode derrubar o resto da aba de performance.
      Promise.all([
        fetchLauraPerformance(),
        fetchWonDeals().catch(() => []),
      ])
        .then(([perfPrograms, wonPrograms]) => {
          if (cancelled) return
          const wonById = new Map(wonPrograms.map((p) => [p.program_id, p]))
          const merged = perfPrograms.map((p) => {
            const won = wonById.get(p.program_id)
            return {
              ...p,
              totalWon: won?.totalWon ?? 0,
              totalWonValue: won?.totalWonValue ?? 0,
              wonDeals: won?.deals ?? [],
            }
          })
          setPrograms(merged)
          setLoading(false)
          setError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err.message || 'Falha ao carregar performance da Laura')
          setLoading(false)
        })
    }

    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MINUTES * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { programs, loading, error }
}
