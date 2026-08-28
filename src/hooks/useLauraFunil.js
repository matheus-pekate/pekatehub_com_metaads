import { useEffect, useState } from 'react'
import { fetchLauraFunil } from '../services/metaAdsApi'
import { REFRESH_INTERVAL_MINUTES } from '../config/metaAds'

export function useLauraFunil() {
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      fetchLauraFunil()
        .then((result) => {
          if (cancelled) return
          setStages(result)
          setLoading(false)
          setError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err.message || 'Falha ao carregar funil da Laura')
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

  return { stages, loading, error }
}
