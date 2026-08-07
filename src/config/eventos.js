export const REFRESH_INTERVAL_MINUTES = 15

export const STATUS_LABELS = {
  curioso: 'Prospect',
  convidado: 'Convidado',
  oportunidade: 'Oportunidade',
  negocio_ganho: 'Negócio Ganho',
  nao_compareceu: 'Não compareceu',
}

export const STATUS_COLORS = {
  curioso: '#94A3B8',
  convidado: '#F26522',
  oportunidade: '#2D6A4F',
  negocio_ganho: '#EAB308',
  nao_compareceu: '#8B5CF6',
}

// Status do negócio (pipedrive_deal_status), usado no sub-filtro de Oportunidades
export const DEAL_STATUS_LABELS = {
  todos: 'Todos',
  open: 'Em andamento',
  lost: 'Perdido',
}

// Prospect é, por definição, gente nova no CRM que nunca teve nenhuma
// interação. Uma pessoa que já existia no CRM antes do evento mas nunca foi
// trabalhada não é "prospect" (isso é exclusivo de quem é novo) — é alguém
// que está no CRM mas ainda sem nenhuma interação registrada.
export function getStatusLabel(status, situacao) {
  if (status === 'curioso' && situacao === 'existente') return 'Sem interação'
  return STATUS_LABELS[status] || status
}
