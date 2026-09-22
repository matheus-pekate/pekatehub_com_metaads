import { PROGRAMS_B2B } from '../config/pipedrive.js'
import { SELLERS_B2B } from './useSellerDataB2B.js'
import { createWeeklyGoalsHook } from './useWeeklyGoals.js'

// Ciclo de venda B2B é bem mais longo que o B2C — a janela pra calcular a
// média de contatos por negócio fechado precisa ser mais ampla (1 ano) pra
// ter amostra suficiente de deals ganhos.
export const useWeeklyGoalsB2B = createWeeklyGoalsHook(SELLERS_B2B, PROGRAMS_B2B, { activityLookbackDays: 365 })
