import { useCallback, useEffect, useState } from 'react'
import { fetchGeneralDocsList } from '../services/generalDocsApi'

export function useGeneralDocs() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const list = await fetchGeneralDocsList()
      setDocs(list)
    } catch (err) {
      setError(err.message || 'Falha ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { docs, loading, error, refresh }
}
