export const REFRESH_INTERVAL_MINUTES = 15

export const STATUS_LABELS = {
  curioso: 'Prospect',
  convidado: 'Sem negociação',
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
// que está no CRM mas ainda sem nenhuma interação registrada. Uma oportunidade
// (negociação em aberto) de quem já existia também é diferente de uma que já
// foi perdida — por isso o rótulo considera o pipedrive_deal_status também.
export function getStatusLabel(status, situacao, dealStatus) {
  if (status === 'curioso') return situacao === 'existente' ? 'Sem interação' : 'Prospect'
  if (status === 'convidado') return 'Sem negociação'
  if (status === 'oportunidade') {
    return situacao === 'existente' && dealStatus === 'lost' ? 'Negociação perdida' : 'Oportunidade'
  }
  if (status === 'negocio_ganho') return situacao === 'existente' ? 'Negociação ganha' : 'Negócio Ganho'
  return STATUS_LABELS[status] || status
}

// Categorias mostradas no drill-down do card e nos filtros dos modais.
// "Já existe no CRM" mostra o estado atual do relacionamento (sem relação de
// data com o evento); "Novo no CRM" mostra só o que este evento realmente
// gerou (dentro da janela de 15 dias/3 meses).
export const EXISTENTE_CATEGORIES = [
  { key: 'todos', status: 'todos', dealStatus: 'todos', label: 'Todos', color: null },
  { key: 'sem_interacao', status: 'curioso', dealStatus: 'todos', label: 'Sem interação', color: STATUS_COLORS.curioso },
  { key: 'sem_negociacao', status: 'convidado', dealStatus: 'todos', label: 'Sem negociação', color: STATUS_COLORS.convidado },
  { key: 'oportunidade', status: 'oportunidade', dealStatus: 'open', label: 'Oportunidade', color: STATUS_COLORS.oportunidade },
  { key: 'negociacao_perdida', status: 'oportunidade', dealStatus: 'lost', label: 'Negociação perdida', color: '#B45309' },
  { key: 'negociacao_ganha', status: 'negocio_ganho', dealStatus: 'todos', label: 'Negociação ganha', color: STATUS_COLORS.negocio_ganho },
]

export const NOVO_CATEGORIES = [
  { key: 'todos', status: 'todos', dealStatus: 'todos', label: 'Todos', color: null },
  { key: 'prospect', status: 'curioso', dealStatus: 'todos', label: 'Prospects', color: STATUS_COLORS.curioso },
  { key: 'oportunidade', status: 'oportunidade', dealStatus: 'todos', label: 'Oportunidades', color: STATUS_COLORS.oportunidade },
  { key: 'negocio_ganho', status: 'negocio_ganho', dealStatus: 'todos', label: 'Negócios Ganhos', color: STATUS_COLORS.negocio_ganho },
]
