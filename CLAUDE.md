# PKT-HUB — guia para trabalhar neste repositório

Central de dados da Pekatê Brasil: Comando B2C (Pipedrive), Comando Meta Ads (n8n), Wiki de Automações, biblioteca de Documentos Gerais e histórico da agente Laura. React + Vite, hospedado na Netlify (Netlify Functions + Supabase, sem servidor próprio).

**Persistência é toda Supabase agora** (`chats.js`, `docs.js`, `general-docs.js` — tabelas/dados no projeto Supabase, ver `.env.example`). O Redis (Redis Cloud) foi descontinuado nessa migração; as únicas sobras são `netlify/functions/migrate-chats-to-supabase.js` (ferramenta de backfill pontual, já executada, mantida só como registro) e as variáveis `REDIS_*` no `.env.example`, que só importam se essa migração precisar rodar de novo. `server/` (Express) e `api/chats.js` (handler estilo Vercel) eram código morto pré-Netlify Functions, baseado em Redis, e foram removidos.

**A documentação técnica completa e sempre atualizada do projeto vive dentro do próprio site**, na aba **Documentação → "Documentação Pekatê Hub"** (biblioteca de Documentos Gerais). Esse arquivo aqui é só o "como trabalhamos" — pra arquitetura/módulos/variáveis de ambiente detalhados, abra aquele documento primeiro.

## Git — dois remotes, deploy manual

- `origin` → `Pekate-brasil/pkt-hub` (repositório oficial).
- `review` → `matheus-pekate/pekatehub_com_metaads` (fork pessoal, usado só como cópia de revisão).

Fluxo padrão pra qualquer mudança:
1. Criar branch a partir de `main`.
2. Commitar e dar `git push` na branch pros **dois** remotes (`review` e `origin`).
3. **Pedir confirmação explícita ao usuário antes de mergear** — mesmo que ele já tenha confirmado outras vezes antes, confirme de novo a cada merge/deploy.
4. `git checkout main && git pull origin main && git merge --no-ff <branch> -m "Merge pull request: ..." && git push origin main`.
5. `npm run build`.
6. **Pedir confirmação explícita antes do deploy em produção** (mesma regra do passo 3).
7. Deploy manual via CLI (não existe deploy automático — foi desligado de propósito, ver abaixo):
   ```
   netlify deploy --prod --dir=dist --functions=netlify/functions --site=c16232d6-8c0a-492b-9017-76266b990a44
   ```
   Precisa de um `NETLIFY_AUTH_TOKEN` (Personal Access Token, gerado em app.netlify.com → avatar → User settings → Applications → Personal access tokens). Esse token **não fica salvo em lugar nenhum** — o usuário precisa fornecer de novo a cada sessão nova. No Windows/PowerShell, sempre usar `$env:NETLIFY_AUTH_TOKEN = "..."` na mesma chamada do comando (nunca como texto literal solto num comando Bash — isso já disparou bloqueio de segurança antes).

**Por que o deploy automático da Netlify está desligado (`stop_builds: true`)**: o gatilho de Git da Netlify tentava buildar a cada push e sempre falhava com "Unrecognized Git contributor" (conta que faz push não é membro verificado no plano). Isso gerava "deploys com erro" fantasmas no painel, sem afetar o site de verdade (que só é publicado pelo deploy manual). Foi desligado deliberadamente — não reativar sem avisar o usuário.

- **Site Netlify**: `pkt-hub` (site id `c16232d6-8c0a-492b-9017-76266b990a44`), produção em `https://pkt-hub.netlify.app`.
- Nova variável de ambiente pra uma feature nova → precisa ser cadastrada manualmente no painel da Netlify (ou via API) **antes** do deploy, senão a feature roda com a variável vazia.

## Como validar antes de subir

- Rodar `npm run dev` local. Funciona para tudo que chama API externa direto (Pipedrive, webhooks n8n) — só não serve as Netlify Functions (`/api/docs`, `/api/general-docs`, `/api/chats`, `/api/workflows`), que exigem `netlify dev` ou produção.
- Pra features que dependem de Netlify Functions + Redis, testar com o backend **simulado via Playwright** (`page.route(...)` interceptando `/api/*` com estado em memória) evita tocar em dados reais de produção — esse é o padrão usado nesta sessão pra validar upload/apagar/substituir de documentos.
- Pra features que só leem API externa (Pipedrive, Meta Ads via n8n), pode testar direto com dados reais — são chamadas `GET`, sem risco.
- Sempre tirar screenshot (Playwright) do resultado antes de reportar como concluído — não confiar só na ausência de erro de console.

## Linguagem visual

Paleta usada em todo o hub (Wiki de Automações, Documentos Gerais, PktHub, dashboards): teal `#08373F` (texto/destaque escuro), laranja `#CB5B36` / `#FE8F20` (accent), fundo creme `#F5F0EB` / branco. Tipografia: `Lato` pro corpo, `Barlow Condensed` itálico + peso 900 pros títulos grandes (mesmo estilo do logo "PKT-HUB" e dos cards). Ao criar uma documentação HTML nova ou uma tela nova, seguir essa paleta em vez de inventar uma nova.

## Padrões de UI já estabelecidos (reaproveitar, não reinventar)

- Modal com overlay escuro + fechar ao clicar fora + botão `✕`: ver `Roulette.jsx`, `ReportPreview.jsx`, `AlertDealsModal.jsx` (Comando B2C) ou `AdDetailModal.jsx` (Meta Ads). Animações `pktFadeIn`/`pktSlideUp` já existem no CSS de cada dashboard.
- Truncar lista longa em card fixo (TV): padrão "top N + `+X outros`", ver `AdsList.jsx` (Meta Ads).
- Gráfico Recharts (Bar+Line): sempre `isAnimationActive={false}` em ambos — sem isso, a animação de entrada corta visualmente o gráfico em determinados layouts (bug já identificado).
- Eixo X de gráfico com data: usar o padrão de tick customizado (`DayAxisTick.jsx`, data em negrito + dia da semana abaixo) em vez de um tick simples.

## Dois usuários do Pipedrive: B2C (Comando B2C) x Meta Ads (n8n)

O Comando B2C fala com a API do Pipedrive **direto do browser** (token exposto no bundle, aceitável por ser ferramenta interna). O Comando Meta Ads **nunca** fala com o Meta Ads direto — tudo passa por webhooks do n8n. Não confundir os dois ao adicionar uma integração nova.
