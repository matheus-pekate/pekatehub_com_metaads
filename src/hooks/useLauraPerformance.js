import { useEffect, useState } from 'react'
import { fetchLauraPerformance } from '../services/metaAdsApi'
import { REFRESH_INTERVAL_MINUTES } from '../config/metaAds'

export function useLauraPerformance() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      // Ganhos não vem mais daqui — o LauraPerformancePanel calcula direto da
      // etapa "Ganho" do funil de SDR da Laura (useLauraFunil), que é a fonte
      // real do funil dela por programa.
      fetchLauraPerformance()
        .then((perfPrograms) => {
          if (cancelled) return
          setPrograms(perfPrograms)
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
