import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  splitByActiveCampaign,
  eligibleB2CIds,
  eligibleB2BIds,
  eligibleMarketingIds,
  nextInRotation,
  autoAdvance,
} from './tvPrograms.js'

const ids = (list) => list.map((p) => p.id)

test('splitByActiveCampaign põe os ativos primeiro e os inativos no fim, mantendo a ordem', () => {
  const programs = [
    { id: 'a', hasActiveCampaigns: true },
    { id: 'b', hasActiveCampaigns: false },
    { id: 'c', hasActiveCampaigns: true },
  ]
  const { ordered, rotationIds } = splitByActiveCampaign(programs)
  assert.deepEqual(ids(ordered), ['a', 'c', 'b'])
  assert.deepEqual(rotationIds, ['a', 'c'])
})

test('splitByActiveCampaign com todos inativos roda a lista inteira', () => {
  const programs = [
    { id: 'a', hasActiveCampaigns: false },
    { id: 'b', hasActiveCampaigns: false },
  ]
  const { ordered, rotationIds } = splitByActiveCampaign(programs)
  assert.deepEqual(ids(ordered), ['a', 'b'])
  assert.deepEqual(rotationIds, ['a', 'b'])
})

test('splitByActiveCampaign com lista vazia devolve listas vazias', () => {
  assert.deepEqual(splitByActiveCampaign([]), { ordered: [], rotationIds: [] })
})

test('eligibleB2CIds mantém só turmas que começam de hoje em diante (hoje conta)', () => {
  const programs = [
    { id: 'gef', startDate: '2026-10-19' },
    { id: 'hoje', startDate: '2026-11-13' },
    { id: 'pdd', startDate: '2026-12-18' },
  ]
  assert.deepEqual(eligibleB2CIds(programs, new Date(2026, 10, 13)), ['hoje', 'pdd'])
})

test('eligibleB2CIds usa a data local, não UTC (noite no Brasil)', () => {
  // 13/11/2026 22:30 no horário local — em UTC já seria dia 14
  const programs = [{ id: 'hoje', startDate: '2026-11-13' }]
  assert.deepEqual(eligibleB2CIds(programs, new Date(2026, 10, 13, 22, 30)), ['hoje'])
})

test('eligibleB2BIds mantém só programas com negócio em aberto', () => {
  const programs = [
    { id: 'paex', totalOpenCount: 3 },
    { id: 'ge', totalOpenCount: 0 },
    { id: 'consultoria', totalOpenCount: 1 },
  ]
  assert.deepEqual(eligibleB2BIds(programs), ['paex', 'consultoria'])
})

test('eligibleMarketingIds mantém só programas com campanha ativa', () => {
  const programs = [
    { id: 'a', hasActiveCampaigns: false },
    { id: 'b', hasActiveCampaigns: true },
  ]
  assert.deepEqual(eligibleMarketingIds(programs), ['b'])
})

test('nextInRotation avança para o próximo sem dar a volta', () => {
  assert.deepEqual(nextInRotation(['a', 'b'], 'a'), { id: 'b', wrapped: false })
})

test('nextInRotation dá a volta depois do último', () => {
  assert.deepEqual(nextInRotation(['a', 'b'], 'b'), { id: 'a', wrapped: true })
})

test('nextInRotation com um só programa sempre completa a volta', () => {
  assert.deepEqual(nextInRotation(['a'], 'a'), { id: 'a', wrapped: true })
})

test('nextInRotation com id fora da lista começa do primeiro sem contar volta', () => {
  assert.deepEqual(nextInRotation(['a', 'b'], 'zzz'), { id: 'a', wrapped: false })
})

test('autoAdvance não avança quando o programa foi fixado por clique manual', () => {
  assert.equal(autoAdvance(['a', 'b'], 'x', true), null)
})

test('autoAdvance sai de um programa que perdeu a campanha sem clique manual', () => {
  // estava na tela, virou inativo no refresh: a rotação segue pro primeiro da lista
  assert.deepEqual(autoAdvance(['a', 'b'], 'x', false), { id: 'a', wrapped: false })
})

test('autoAdvance dentro da rotação segue o próximo normalmente', () => {
  assert.deepEqual(autoAdvance(['a', 'b'], 'a', false), { id: 'b', wrapped: false })
})
