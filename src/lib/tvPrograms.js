// Regras puras do Modo TV e da rotação do Comando Marketing: quais programas
// entram na rotação e qual é o próximo. Sem React, pra poder testar com node:test.

// Ativos (com campanha) na frente, inativos no fim, cada grupo na ordem original.
// A rotação automática só passa pelos ativos; se nenhum estiver ativo, roda a
// lista inteira pra tela nunca ficar sem carrossel.
export function splitByActiveCampaign(programs) {
  const active = programs.filter((p) => p.hasActiveCampaigns)
  const inactive = programs.filter((p) => !p.hasActiveCampaigns)
  const ordered = [...active, ...inactive]
  const rotation = active.length > 0 ? active : ordered
  return { ordered, rotationIds: rotation.map((p) => p.id) }
}

// "AAAA-MM-DD" na data LOCAL (toISOString é UTC e erraria o dia à noite no Brasil).
function toLocalIsoDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// B2C na TV: turmas que ainda não começaram (a partir de hoje, inclusive).
export function eligibleB2CIds(programs, today) {
  const todayIso = toLocalIsoDate(today)
  return programs.filter((p) => p.startDate >= todayIso).map((p) => p.id)
}

// B2B na TV: programas com ao menos um negócio em aberto.
export function eligibleB2BIds(programs) {
  return programs.filter((p) => p.totalOpenCount > 0).map((p) => p.id)
}

// Marketing na TV: programas com campanha ativa.
export function eligibleMarketingIds(programs) {
  return programs.filter((p) => p.hasActiveCampaigns).map((p) => p.id)
}

// Próximo id da rotação. `wrapped` indica que passou do último (fim de ciclo).
export function nextInRotation(ids, currentId) {
  const idx = ids.indexOf(currentId)
  if (idx === -1) return { id: ids[0], wrapped: false }
  const nextIdx = idx + 1
  if (nextIdx >= ids.length) return { id: ids[0], wrapped: true }
  return { id: ids[nextIdx], wrapped: false }
}

// Passo da rotação automática do Marketing. `pinned` = alguém clicou à mão num
// programa fora da rotação: aí não avança (devolve null). Sem clique, um programa
// que perdeu a campanha no refresh não prende a tela: segue pro primeiro da lista.
export function autoAdvance(ids, currentId, pinned) {
  if (pinned) return null
  return nextInRotation(ids, currentId)
}
