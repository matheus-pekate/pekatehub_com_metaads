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
      fetchLauraPerformance()
        .then((result) => {
          if (cancelled) return
          setPrograms(result)
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
