import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { Login } from './pages/Login.jsx'

export function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', background: '#f5f0eb' }} />
  }

  if (!session) {
    return <Login />
  }

  return children
}
