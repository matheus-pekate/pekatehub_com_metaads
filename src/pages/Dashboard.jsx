import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ProgramCard } from '../components/ProgramCard.jsx'
import { FunnelChart } from '../components/charts/FunnelChart.jsx'
import { SellersTable } from '../components/SellersTable.jsx'
import { RevenueGoalCard } from '../components/RevenueGoalCard.jsx'
import { ProgramTargetsCard } from '../components/ProgramTargetsCard.jsx'

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function MetricCard({ label, value, context, accentColor }) {
  return (
    <div className="bg-teal-800/40 border border-teal-700/30 rounded-lg p-4 flex flex-col justify-between">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 font-700">
        {label}
      </p>
      <p
        className="font-display font-800 text-2xl leading-none my-3"
        style={{ color: accentColor }}
      >
        {value}
      </p>
      <p className="text-[11px] text-white/45 leading-tight">{context}</p>
    </div>
  )
}

export function Dashboard({ data, showAllPrograms = true }) {
  const [selectedProgramId, setSelectedProgramId] = useState(data.programs[0]?.id)

  const visiblePrograms = showAllPrograms
    ? data.programs
    : data.programs.filter((p) => p.id === 'pos')

  // Se o programa atualmente selecionado for ocultado, volta para Pós
  useEffect(() => {
    if (!visiblePrograms.find((p) => p.id === selectedProgramId)) {
      setSelectedProgramId(visiblePrograms[0]?.id)
    }
  }, [visiblePrograms, selectedProgramId])

  const selectedProgram = visiblePrograms.find((p) => p.id === selectedProgramId)

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
      {/* BLOCO 1 — Cards de resumo */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-4">
          Visão Geral — Programas B2C
        </p>
        <div className={`grid gap-4 ${showAllPrograms ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {visiblePrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              isSelected={program.id === selectedProgramId}
              onClick={() => setSelectedProgramId(program.id)}
            />
          ))}
        </div>
      </section>

      {/* BLOCO 2 — Linha superior (placeholders) */}
      {selectedProgram && (
        <section className="grid grid-cols-2 gap-6">
          <div className="bg-teal-900/30 border border-teal-700/30 rounded-lg p-6 min-h-[480px]">
            <div className="grid grid-rows-3 gap-4 h-full">
              <MetricCard
                label="Total ganho"
                value={formatBRL(selectedProgram.totalWonValue)}
                context={`${selectedProgram.converted} ${selectedProgram.converted === 1 ? 'aluno convertido' : 'alunos convertidos'}`}
                accentColor={selectedProgram.accentColor}
              />
              <MetricCard
                label="Forecast"
                value={formatBRL(selectedProgram.forecast)}
                context={`${selectedProgram.forecastCount} ${selectedProgram.forecastCount === 1 ? 'lead qualificado' : 'leads qualificados'}`}
                accentColor={selectedProgram.accentColor}
              />
              <MetricCard
                label="Taxa de conversão"
                value={`${selectedProgram.conversionRate.toFixed(1).replace('.', ',')}%`}
                context={`${selectedProgram.converted} ${selectedProgram.converted === 1 ? 'ganho' : 'ganhos'} de ${selectedProgram.totalDealsCount} criados`}
                accentColor={selectedProgram.accentColor}
              />
            </div>
          </div>
          <div className="bg-teal-900/30 border border-teal-700/30 rounded-lg p-6 min-h-[480px]">
            <div className="grid grid-rows-2 gap-4 h-full">
              <div className="bg-teal-800/40 border border-teal-700/30 rounded-lg p-2">
                <ProgramTargetsCard program={selectedProgram} />
              </div>
              <div className="bg-teal-800/40 border border-teal-700/30 rounded-lg p-4">
                <RevenueGoalCard program={selectedProgram} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BLOCO 3 — Funil + Performance lado a lado */}
      {selectedProgram && (
        <section className="grid grid-cols-2 gap-6">
          {/* Distribuição do funil */}
          <div className="bg-teal-900/30 border border-teal-700/30 rounded-lg p-6 flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-1">
                  Distribuição do funil
                </p>
                <h4 className="text-white/80 text-sm font-400">{selectedProgram.shortName}</h4>
              </div>
              <div
                className="text-[10px] px-2 py-1 rounded uppercase tracking-widest font-700"
                style={{
                  color: selectedProgram.accentColor,
                  background: `${selectedProgram.accentColor}15`,
                }}
              >
                {selectedProgram.totalActive} ativos
              </div>
            </div>
            <FunnelChart
              stagesData={selectedProgram.stagesData}
              winStageId={selectedProgram.winStageId}
              accentColor={selectedProgram.accentColor}
            />
          </div>

          {/* Performance por vendedor */}
          <div className="bg-teal-900/30 border border-teal-700/30 rounded-lg p-6 h-[480px] overflow-hidden">
            <SellersTable
              sellers={data.sellers}
              programId={selectedProgram.id}
              accentColor={selectedProgram.accentColor}
              programGoal={selectedProgram.goal}
            />
          </div>
        </section>
      )}
    </div>
  )
}
