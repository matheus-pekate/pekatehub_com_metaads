import { useEffect, useState } from 'react'
import { fetchProgramDailyBreakdown } from '../services/metaAdsApi'

export function useProgramDailyBreakdown(programId) {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!programId) {
      setDays([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchProgramDailyBreakdown(programId)
      .then((result) => {
        if (cancelled) return
        setDays(result)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Falha ao carregar histórico do programa')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [programId])

  return { days, loading, error }
}
