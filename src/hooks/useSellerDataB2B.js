import { PROGRAMS_B2B } from '../config/pipedrive.js'
import { createSellerDataHook } from './useSellerData.js'

// Chave do campo customizado "SDR" nos deals B2B (Pipedrive dealFields) e o
// id da opção "Lucas" dentro dele — usados só pela meta de reunião agendada
// do Lucas Braga (SDR), em useWeeklyGoals.js.
export const SDR_FIELD_KEY = 'f1f4addb7dc8f92d12c1e46191ea9f56ee33908b'
export const SDR_OPTION_LUCAS = 575

export const SELLERS_B2B = [
  { id: 11572121, name: 'Andressa Lucas' },
  { id: 27421066, name: 'Rodrigo Mendes' },
  { id: 11572131, name: 'Maylla Batista' },
  {
    id: 26304643,
    name: 'Lucas Braga',
    // Lucas é SDR, não closer — a meta dele não é negócio fechado, é
    // reunião agendada: atividade tipo "Reunião", dono = Lucas, no deal
    // vinculado o campo "SDR" precisa estar marcado como "Lucas".
    goalMetric: {
      type: 'activity',
      activityType: 'meeting',
      label: 'reunião agendada',
      labelPlural: 'reuniões agendadas',
      dealCustomField: { key: SDR_FIELD_KEY, value: SDR_OPTION_LUCAS },
    },
  },
]

// Ciclo de venda B2B é bem mais longo que o B2C (semanas/meses entre um won
// e outro) e as metas são anuais — por isso o período aqui é ano-calendário
// (2026, 2025, ...), igual ao Comando B2B, em vez de uma janela rolante de
// dias (que quase sempre mostraria "0 Won" mesmo para quem converteu).
export const useSellerDataB2B = createSellerDataHook(SELLERS_B2B, PROGRAMS_B2B, { yearMode: true })
