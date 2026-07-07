import { useCallback, useEffect, useState } from 'react'
import { fetchDocsList } from '../services/docsApi'

export function useDocsList() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchDocsList()
      setDocs(result)
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
