# Modo TV + ordem do Comando Marketing — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marketing deixa programas sem campanha ativa no fim da faixa e fora da rotação; novo botão **TV** no menu lateral roda B2C → B2B → Marketing em loop, só com o que está "acontecendo".

**Architecture:** Helpers puros em `src/lib/tvPrograms.js` (testados com `node --test`) decidem ordem, elegibilidade e próximo da rotação. As três telas de comando viram componentes internos que recebem dados por prop e aceitam `tv={{ programIds, onCycleEnd }}`. Um orquestrador `/tv` (`pages/TvMode.jsx`) chama os 3 hooks de dados uma vez e monta a fase atual.

**Tech Stack:** React 18, react-router-dom, Vite, `node:test` (sem dependência nova), Playwright (validação manual, backend simulado).

**Spec:** `docs/superpowers/specs/2026-11-13-modo-tv-e-marketing-design.md`

## Global Constraints

- Português BR com acentuação correta em todo texto visível e comentários.
- B2C elegível na TV: `startDate >= hoje` (comparação de string `YYYY-MM-DD` com a data local de hoje; hoje conta como "ainda não iniciada").
- B2B elegível: `totalOpenCount > 0` no ano **atual** (`new Date().getFullYear()`).
- Marketing elegível: `hasActiveCampaigns === true`.
- Sem dependência nova no `package.json`. Sem commit em `main`; branch `feature/modo-tv-e-marketing` já criada.
- Rotas atuais (`/pekate-dash`, `/comando-b2b`, `/meta-ads`) mantêm o comportamento, exceto a ordem/rotação do Marketing.
- Paleta e padrões do CLAUDE.md (teal `#08373F`, laranja `#CB5B36`/`#FE8F20`, creme `#F5F0EB`; Lato / Barlow Condensed).
- Push para os **dois** remotes (`review` e `origin`) na branch; **pedir confirmação antes de merge e antes de deploy** (CLAUDE.md).

## Review Focus

- Marketing com **todos** os programas sem campanha: carrossel não pode quebrar nem dividir por zero (rotação cai para a lista inteira).
- Dados do Marketing recarregam (a cada 15 min) e a ordem muda enquanto um programa está ativo na tela: a tela deve continuar no mesmo programa (estado por `id`, não por índice).
- TV: fase B2B ou Marketing com zero elegíveis é pulada sem piscar nem entrar em loop infinito; se as três ficarem vazias aparece aviso.
- TV: B2B/Marketing ainda carregando não podem ser pulados como "vazios".
- Lista de 1 programa na TV: ao fim do tempo chama `onCycleEnd` (não fica parado nem repete sozinho).
- Clique manual num programa inativo do Marketing (fora da TV): rotação para nele e não avança sozinha.

---

### Task 1: Helpers puros `tvPrograms.js`

**Files:**
- Create: `src/lib/tvPrograms.js`
- Test: `src/lib/tvPrograms.test.js`

**Interfaces:**
- Produces:
  - `splitByActiveCampaign(programs: {id, hasActiveCampaigns}[]): { ordered: Program[], rotationIds: string[] }` — `ordered` = ativos (ordem original) + inativos (ordem original); `rotationIds` = ids dos ativos, ou **todos** os ids de `ordered` se nenhum ativo.
  - `eligibleB2CIds(programs: {id, startDate}[], today: Date): string[]` — ids com `startDate >= hoje` (data local `YYYY-MM-DD`), ordem original.
  - `eligibleB2BIds(programs: {id, totalOpenCount}[]): string[]` — `totalOpenCount > 0`.
  - `eligibleMarketingIds(programs: {id, hasActiveCampaigns}[]): string[]`.
  - `nextInRotation(ids: string[], currentId: string): { id: string, wrapped: boolean }` — próximo id; `wrapped: true` quando passou do último; `currentId` ausente em `ids` → `{ id: ids[0], wrapped: false }`; lista de 1 → `{ id: ids[0], wrapped: true }`.

- [ ] **Step 1: Escrever os testes que falham** em `src/lib/tvPrograms.test.js` com `node:test` + `node:assert/strict`:
  - `splitByActiveCampaign` com `[a(ativo), b(inativo), c(ativo)]` → `ordered` ids `['a','c','b']`, `rotationIds` `['a','c']`.
  - `splitByActiveCampaign` com todos inativos → `rotationIds` igual aos ids de `ordered`; lista vazia → `{ ordered: [], rotationIds: [] }`.
  - `eligibleB2CIds` com `today = new Date(2026, 10, 13)` e startDates `'2026-10-19'`, `'2026-11-13'`, `'2026-12-18'` → só os dois últimos (hoje conta).
  - `eligibleB2BIds` com `totalOpenCount` `[3, 0, 1]` → ids 1º e 3º.
  - `eligibleMarketingIds` igual ao filtro de `hasActiveCampaigns`.
  - `nextInRotation(['a','b'], 'a')` → `{id:'b', wrapped:false}`; `('b')` → `{id:'a', wrapped:true}`; `(['a'], 'a')` → `{id:'a', wrapped:true}`; `(['a','b'], 'zzz')` → `{id:'a', wrapped:false}`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test src/lib/tvPrograms.test.js`
Expected: FAIL (módulo `./tvPrograms.js` não existe).

- [ ] **Step 3: Implementar** as 5 funções em `src/lib/tvPrograms.js` (ESM, `export function`). Para a data local de hoje, montar `YYYY-MM-DD` com `getFullYear/getMonth/getDate` (não usar `toISOString`, que é UTC e erra à noite no Brasil).

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test src/lib/tvPrograms.test.js`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tvPrograms.js src/lib/tvPrograms.test.js docs/superpowers
git commit -m "Modo TV: helpers de elegibilidade e rotação de programas"
```

---

### Task 2: Marketing — inativos no fim e fora da rotação

**Files:**
- Modify: `src/pages/MetaAdsDash.jsx`
- Modify: `src/components/meta-ads/ProgramStrip.jsx` (nenhuma mudança de lógica; só recebe a lista já ordenada — confirmar que `pkt-meta-pill--empty` já deixa a pílula apagada em `src/pages/meta-ads-dash.css`; se não deixar, ajustar `opacity` ali)

**Interfaces:**
- Consumes: `splitByActiveCampaign`, `nextInRotation` (Task 1).
- Produces: componente exportado `ComandoMarketing({ meta, tv })` em `MetaAdsDash.jsx`, onde `meta = { data, error, lastUpdated, refresh }` (retorno de `useMetaAdsData`) e `tv` opcional `{ programIds: string[], onCycleEnd: () => void }`. `MetaAdsDash()` continua exportado: chama `useMetaAdsData()` e renderiza `<ComandoMarketing meta={...} />`.

- [ ] **Step 1: Extrair** o corpo atual de `MetaAdsDash` para `ComandoMarketing({ meta, tv })` (hooks de dados ficam só no wrapper `MetaAdsDash`). Sem mudar comportamento ainda. Rodar `npm run build` → sucesso.

- [ ] **Step 2: Trocar `activeIdx` por `activeId`** (estado string; `epoch` continua). `activeProgram = ordered.find(p => p.id === activeId) ?? ordered[0]`. Assim, quando o refresh reordena, a tela segue no mesmo programa.

- [ ] **Step 3: Ordem e rotação.** `{ ordered, rotationIds } = useMemo(() => splitByActiveCampaign(data), [data])`; na TV, `rotationIds = tv.programIds` e `ordered` = só esses (na ordem de `tv.programIds`). `ProgramStrip` recebe `ordered`. O timer avança com `nextInRotation(rotationIds, activeProgram.id)`: se `wrapped && tv` → `tv.onCycleEnd()` (sem mudar `activeId`); senão `setActiveId(next.id)`. Se `activeProgram.id` **não está** em `rotationIds` (clique manual num inativo, fora da TV): não agenda timer e a barra de progresso fica `animationPlayState: 'paused'`.

- [ ] **Step 4: Na TV** o botão de pausa e o clique manual continuam funcionando; `Topbar` inalterada.

- [ ] **Step 5: Verificar** com `npm run dev` + Playwright, interceptando os webhooks do n8n usados por `src/services/metaAdsApi.js` (ler o arquivo pra pegar as URLs) com 2 programas ativos e 2 sem campanha misturados: strip mostra ativos primeiro, inativos apagados no fim; cronometrar que a rotação só alterna entre os ativos; clicar num inativo mostra o detalhe e a rotação não avança. Tirar screenshot. Rodar `npm run build` → sucesso.

- [ ] **Step 6: Commit**

```bash
git add src/pages/MetaAdsDash.jsx src/components/meta-ads src/pages/meta-ads-dash.css
git commit -m "Comando Marketing: programas sem campanha ativa ficam no fim e fora da rotação"
```

---

### Task 3: B2C e B2B aceitam modo TV

**Files:**
- Modify: `src/pages/PekateDash.jsx`
- Modify: `src/pages/PekateB2BDash.jsx`
- Modify: `src/components/pekate-dash-b2b/B2BTopbar.jsx`

**Interfaces:**
- Consumes: `nextInRotation` (Task 1).
- Produces:
  - `ComandoB2C({ year, dashboard, onChangeYear, tv })` exportado de `PekateDash.jsx` (já existe sem export e sem `tv`). Em TV: `year` pode ser `undefined`; `tv = { programIds, onCycleEnd }`.
  - `ComandoB2B({ year, b2b, tv })` exportado de `PekateB2BDash.jsx`, com `b2b = { data, lastUpdated }` (retorno de `useB2BDashboardData(year)`). `PekateB2BDash()` continua exportado: mantém o seletor de ano e chama o hook; renderiza `<ComandoB2B>`.
  - `B2BTopbar` ganha prop opcional `lockYear: boolean` — quando `true`, não renderiza `PeriodSelector`.

- [ ] **Step 1: B2C.** Exportar `ComandoB2C`. Quando `tv` existir: a lista do carrossel = `CAROUSEL` filtrado/ordenado por `tv.programIds` (mantendo as `duration` de cada id); `data.programs` passado a `PulseRow`/foco = só esses programas; **não** filtrar por `year`. No avanço do timer usar `nextInRotation`; `wrapped && tv` → `tv.onCycleEnd()`. Sem `tv`, comportamento atual (wrap normal). O layout de 2027 (`layout={year >= 2027 ? '2027' : undefined}` e `showRecent`) passa a usar `activeProgram.year >= 2027` (equivale ao atual no fluxo normal, e funciona na TV com anos misturados). `Topbar` sem `year` esconde o botão de trocar ano (já é assim: `{selectedYear && ...}`).

- [ ] **Step 2: B2B.** Extrair o corpo de `PekateB2BDash` para `ComandoB2B`. Em TV: `year = new Date().getFullYear()`, `programs` limitados a `tv.programIds` (ordem de `tv.programIds`) para `B2BPulseRow`; `CAROUSEL` vira essa lista; `wrapped` → `tv.onCycleEnd()`; `B2BTopbar lockYear`. Sem `tv`: comportamento atual.

- [ ] **Step 3: Verificar** com Playwright em `/pekate-dash?ano=2027` e `/comando-b2b` que nada mudou (screenshot de cada) e que `npm run build` passa.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PekateDash.jsx src/pages/PekateB2BDash.jsx src/components/pekate-dash-b2b/B2BTopbar.jsx
git commit -m "Comando B2C e B2B: aceitam modo TV (lista de programas e fim de ciclo)"
```

---

### Task 4: Orquestrador `/tv` + botão no menu lateral

**Files:**
- Create: `src/pages/TvMode.jsx`
- Modify: `src/main.jsx` (rota `/tv`)
- Modify: `src/pages/PktHub.jsx` (`SIDEBAR_ITEMS`, `NavIcon`, clique do item)

**Interfaces:**
- Consumes: `ComandoB2C`, `ComandoB2B`, `ComandoMarketing` (Tasks 2–3); `eligibleB2CIds`, `eligibleB2BIds`, `eligibleMarketingIds` (Task 1); hooks `useDashboardData()`, `useB2BDashboardData(new Date().getFullYear())`, `useMetaAdsData()`; `PROGRAMS` de `config/pipedrive.js`.
- Produces: `TvMode()` exportado; rota `/tv`.

- [ ] **Step 1: `TvMode.jsx`.** Fases fixas `['b2c', 'b2b', 'marketing']`, estado `phase`. Elegíveis por fase: B2C = `eligibleB2CIds(PROGRAMS, new Date())` (conhecido de imediato → `ready: true`); B2B = `eligibleB2BIds(b2b.data.programs)` com `ready = !!b2b.data`; Marketing = `eligibleMarketingIds(meta.data)` com `ready = !meta.loading`. `advance()` vai para a próxima fase **na ordem circular**. Renderiza `ComandoB2C` / `ComandoB2B` / `ComandoMarketing` da fase atual com `key={phase}` e `tv={{ programIds, onCycleEnd: advance }}`.
  - Fase `ready` e sem elegíveis → `useEffect` chama `advance()`.
  - Fase não `ready` → renderiza a tela mesmo assim (cada comando já tem seu estado de carregamento), sem pular.
  - Se as três fases estão `ready` e vazias → mostra aviso "Nenhum programa em andamento para exibir na TV" com botão de voltar ao hub (visual na paleta do hub, reaproveitando classes do `pkt-` onde servir) e **não** chama `advance` (evita loop).

- [ ] **Step 2: Rota** `<Route path="/tv" element={<TvMode />} />` em `src/main.jsx`.

- [ ] **Step 3: Menu lateral.** Adicionar ao fim de `SIDEBAR_ITEMS` `{ id: 'tv', label: 'TV', icon: 'tv', href: '/tv' }`; ícone `tv` (monitor: `<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/>`) em `NavIcon`; no `onClick` do item, se `item.href` → `navigate(item.href)`, senão `handleTabChange`. O item TV nunca fica "ativo" (a navegação sai da página).

- [ ] **Step 4: Verificar com Playwright** (backend simulado, padrão do CLAUDE.md): interceptar a API do Pipedrive (`api.pipedrive.com`) e os webhooks do n8n com dados mínimos. Para acelerar, usar `page.clock` (ou reduzir tempo via `page.clock.fastForward`) para avançar o carrossel. Checar: (a) clique em **TV** no hub abre `/tv`; (b) B2C só mostra PDD, C-Level, PDC, LDI na faixa (hoje 13/11/2026); (c) depois do último B2C entra o B2B só com programas de `totalOpenCount > 0`; (d) depois o Marketing só com campanhas ativas; (e) volta ao B2C; (f) caso com B2B sem nenhum aberto → fase pulada; (g) caso com as 3 vazias → aviso, sem loop. Screenshot de cada fase.

- [ ] **Step 5: Build e commit**

Run: `npm run build` → sucesso.

```bash
git add src/pages/TvMode.jsx src/main.jsx src/pages/PktHub.jsx
git commit -m "Modo TV: botão no menu lateral e rota /tv rodando B2C, B2B e Marketing em loop"
```

---

### Task 5: Documentação e entrega

**Files:**
- Modify: a documentação "Documentação Pekatê Hub" vive no site (biblioteca de Documentos Gerais, via Redis) — **não** editar em produção sem confirmação; só **avisar o usuário** que o doc deve ganhar a seção "Modo TV".

- [ ] **Step 1:** `git push` da branch para `review` e `origin`.
- [ ] **Step 2:** Pedir confirmação explícita ao usuário antes do merge; depois do merge e `npm run build`, pedir confirmação antes do deploy e o `NETLIFY_AUTH_TOKEN` (CLAUDE.md).

---

## Self-review

- **Cobertura do spec:** 1 (Marketing) → Task 2; 2–3 (TV + filtros) → Tasks 1, 3, 4; 4 (mesmas telas, sem seletor de ano) → Tasks 3–4 (`year` ausente / `lockYear`); detalhes (pular fase vazia, esperar carregamento, botão no fim do menu, ícone de monitor) → Task 4.
- **Consistência de tipos:** `nextInRotation`, `*Ids`, `splitByActiveCampaign` usados com as mesmas assinaturas nas Tasks 2–4; `tv = { programIds, onCycleEnd }` idêntico nas 3 telas.
- **Review Focus:** cada linha tem verificação na task dona (reordenação com `activeId` → Task 2 Step 2; todos inativos / 1 programa → testes da Task 1; carregando/vazia/aviso → Task 4 Steps 1 e 4; clique em inativo → Task 2 Steps 3 e 5).
