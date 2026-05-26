import { RefreshCw, Eye, EyeOff } from 'lucide-react'
import logo from '/pekate-logo.png'

export function Header({ lastUpdated, onRefresh, loading, showAllPrograms, onToggleShowPrograms }) {
  const formatted = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-teal-700/50">
      <div className="flex items-center">
        <img src={logo} alt="Pekate" style={{ height: '55px' }} className="w-auto" />
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Última atualização</p>
          <p className="text-sm text-white/60 font-light">{formatted}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded border border-brand-orange/40 text-brand-orange text-xs uppercase tracking-widest hover:bg-brand-orange/10 transition-all disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
        <button
          onClick={onToggleShowPrograms}
          title={showAllPrograms ? 'Ocultar GECOM e GEF' : 'Exibir GECOM e GEF'}
          className="flex items-center justify-center w-9 h-9 rounded border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
        >
          {showAllPrograms ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
    </header>
  )
}
