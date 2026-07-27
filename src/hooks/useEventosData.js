import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEventos } from '../services/eventosApi'
import { REFRESH_INTERVAL_MINUTES } from '../config/eventos'

export function useEventosData() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const dataRef = useRef(data)

  const load = useCallback(async () => {
    try {
      const eventos = await fetchEventos()
      const sorted = [...eventos].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''))
      dataRef.current = sorted
      setData(sorted)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message || 'Falha ao carregar dados de Eventos')
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
