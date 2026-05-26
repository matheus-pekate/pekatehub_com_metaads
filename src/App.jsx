import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Header } from './components/layout/Header.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { useDashboardData } from './hooks/useDashboardData.js'

function LoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2 size={32} className="text-brand-orange animate-spin" />
      <p className="text-white/30 text-sm uppercase tracking-widest">
        Carregando dados do Pipedrive…
      </p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <AlertTriangle size={32} className="text-red-400" />
      <p className="text-white/60 text-sm">Erro ao carregar dados</p>
      <p className="text-white/30 text-xs max-w-md text-center">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 text-xs uppercase tracking-widest border border-brand-orange/40 text-brand-orange rounded hover:bg-brand-orange/10 transition-all"
      >
        Tentar novamente
      </button>
    </div>
  )
}

export default function App() {
  const { data, loading, error, lastUpdated, refresh } = useDashboardData()
  const [showAllPrograms, setShowAllPrograms] = useState(true)

  return (
    <div className="min-h-screen bg-teal-gradient text-white flex flex-col font-sans">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
        showAllPrograms={showAllPrograms}
        onToggleShowPrograms={() => setShowAllPrograms((v) => !v)}
      />

      {loading && !data && <LoadingScreen />}
      {error && !data && <ErrorScreen message={error} onRetry={refresh} />}
      {data && <Dashboard data={data} showAllPrograms={showAllPrograms} />}
    </div>
  )
}
