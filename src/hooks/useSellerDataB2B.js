import { PROGRAMS_B2B } from '../config/pipedrive.js'
import { createSellerDataHook } from './useSellerData.js'

export const SELLERS_B2B = [
  { id: 11572121, name: 'Andressa Lucas' },
  { id: 9892007, name: 'Leonardo Ramos Teixeira' },
  { id: 11572131, name: 'Maylla Batista' },
]

// Ciclo de venda B2B é bem mais longo que o B2C (semanas/meses entre um won
// e outro) e as metas são anuais — por isso o período aqui é ano-calendário
// (2026, 2025, ...), igual ao Comando B2B, em vez de uma janela rolante de
// dias (que quase sempre mostraria "0 Won" mesmo para quem converteu).
export const useSellerDataB2B = createSellerDataHook(SELLERS_B2B, PROGRAMS_B2B, { yearMode: true })
