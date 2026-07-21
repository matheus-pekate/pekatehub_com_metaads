import { PROGRAMS_B2B } from '../config/pipedrive.js'
import { createSellerDataHook } from './useSellerData.js'

export const SELLERS_B2B = [
  { id: 11572121, name: 'Andressa Lucas' },
  { id: 9892007, name: 'Leonardo Ramos Teixeira' },
  { id: 11572131, name: 'Maylla Batista' },
]

// Ciclo de venda B2B é bem mais longo que o B2C (semanas/meses entre um
// won e outro) — um período padrão de 30 dias quase sempre mostra "0 Won"
// mesmo para vendedores que converteram recentemente. 365 dias alinha
// melhor com a leitura anual já usada no Comando B2B.
export const useSellerDataB2B = createSellerDataHook(SELLERS_B2B, PROGRAMS_B2B, 365)
