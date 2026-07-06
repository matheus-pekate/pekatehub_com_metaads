import { useEffect, useState } from 'react'
import { fetchAdDailyBreakdown } from '../services/metaAdsApi'

export function useAdDailyBreakdown(adId) {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!adId) {
      setDays([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchAdDailyBreakdown(adId)
      .then((result) => {
        if (cancelled) return
        setDays(result)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Falha ao carregar histórico do anúncio')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [adId])

  return { days, loading, error }
}
