import { PROGRAMS_B2B } from '../config/pipedrive.js'
import { SELLERS_B2B } from './useSellerDataB2B.js'
import { createRankingDataHook } from './useRankingData.js'

// Mesmo motivo do useSellerDataB2B: ano-calendário, não janela rolante.
export const useRankingDataB2B = createRankingDataHook(SELLERS_B2B, PROGRAMS_B2B, { yearMode: true })
