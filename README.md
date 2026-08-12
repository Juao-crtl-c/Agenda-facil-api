# Agenda Fácil — API

API de agendamento online para negócios locais (salões, barbearias, clínicas,
consultórios), desenvolvida pela **Vianova Dev**. Segundo projeto de
portfólio da marca, depois do [Vianova Gestão
Financeira](https://github.com/Juao-crtl-c/vianova-gestao-financeira) — mas
diferente daquele (Next.js full-stack sobre Supabase), este é uma **API REST
própria**: Node/Express/Postgres com autenticação, persistência e
documentação construídas do zero, sem depender de um BaaS.

Este repositório é só o backend (`agenda-facil-api`). O frontend —
[`agenda-facil-web`](https://github.com/Juao-crtl-c/agenda-facil-web),
Next.js consumindo esta API — é um repositório separado.

## Produção

**https://agenda-facil-api-blbj.onrender.com** (docs em `/docs`) — publicada
na Render, deploy automático a cada push em `master`. Banco na Neon
compartilhado com o ambiente de dev por enquanto (ver roadmap: branch
dedicada é o próximo passo natural).

## O problema que resolve

Negócio pequeno agenda pelo WhatsApp: esquece de anotar, marca dois clientes
no mesmo horário, o cliente não sabe o que está livre sem perguntar, e sem
lembrete automático o no-show é frequente. A Agenda Fácil dá pro negócio uma
página pública onde o cliente marca sozinho — vê só os horários realmente
livres, sem precisar criar conta — e o dono tem um painel pra configurar
serviços, horário de funcionamento e bloqueios.

## Stack e por quê

- **Express + TypeScript** sobre **Postgres** (hospedado na
  [Neon](https://neon.tech), free tier).
- **Prisma** como ORM/migrations — contraste deliberado com o projeto
  anterior (que evitou ORM de propósito): aqui o objetivo também é mostrar
  esse lado (migrations versionadas, client tipado, camada de repositório
  isolada).
- **Zod** valida a entrada de cada rota — e o mesmo schema Zod gera a
  documentação OpenAPI (`@asteasolutions/zod-to-openapi` +
  `swagger-ui-express`, servida em `/docs`). Fonte única de verdade: a doc
  nunca dessincroniza da validação real porque são o mesmo objeto.
- **JWT + bcryptjs** para autenticação do dono (rotas públicas de
  agendamento não exigem login — é o próprio ponto do produto).
- **date-fns + date-fns-tz** para todo cálculo de horário.
- **Vitest + Supertest** para testes.

## Arquitetura em camadas

```
src/
  routes/          Express Router por recurso — liga validação Zod + controller
  controllers/     parseia a request, chama o service, formata a resposta HTTP
  services/        regra de negócio (disponibilidade, double-booking, etc.)
  repositories/    único lugar que chama o Prisma Client
  schemas/         Zod schemas — validação E fonte da doc OpenAPI
  middleware/      auth (JWT), validate(schema), internalAuth, error handler
  lib/             prisma client, env (validado com Zod), jwt, email, openapi
```

Nenhuma camada pula a de baixo: rota nunca chama Prisma direto, controller
nunca contém regra de negócio. Facilita testar cada camada isolada e trocar
peças (ex: trocar Postgres por outro banco só mexeria em `repositories/`).

## Os dois pontos técnicos centrais

### Cálculo de disponibilidade
`src/services/disponibilidade.service.ts` — dado negócio + serviço + data,
converte o horário de funcionamento (horário de parede, ex: "abre às 9h") pro
fuso IANA do negócio (`date-fns-tz`, cada negócio tem seu próprio `timezone`,
não é fixo em UTC-3), gera os slots possíveis a cada duração do serviço, e
remove os que colidem com agendamentos confirmados, bloqueios, ou que já
passaram. Testado em `tests/services/disponibilidade.test.ts` (lógica pura,
sem banco) cobrindo: dia sem expediente, colisão com agendamento, colisão com
bloqueio, serviço que não cabe até o fechamento, e um caso que cruza a virada
de dia em UTC mas não no fuso do negócio.

### Prevenção de double-booking
Duas camadas — não só "checar disponibilidade e inserir numa transação"
(que ainda corre risco de corrida sob o isolamento padrão do Postgres,
`READ COMMITTED`):

1. **Garantia de verdade, no banco**: uma `EXCLUDE` constraint com
   `btree_gist` na tabela `agendamentos`
   (`prisma/migrations/.../migration.sql`) impede, por construção, dois
   registros `CONFIRMADO` do mesmo negócio com intervalos de tempo
   sobrepostos — não importa o que a aplicação faça.
2. **UX, na aplicação**: o serviço primeiro valida contra a disponibilidade
   recalculada (erro amigável no caminho comum) e faz o insert; se o
   Postgres rejeitar pela exclusion constraint mesmo assim (duas requisições
   concorrentes passaram na checagem ao mesmo tempo), o serviço captura e
   devolve 409.

Testado em `tests/integration/agendamento.test.ts` com um teste que dispara
duas criações de agendamento pro mesmo slot em paralelo (`Promise.all`)
contra o banco de verdade e confirma que só uma foi aceita.

## Rotas

Documentação interativa completa em `/docs` (Swagger UI) depois de rodar a
API. Resumo:

**Públicas** — `GET /api/negocios/:slug`, `GET
/api/negocios/:slug/disponibilidade`, `POST /api/negocios/:slug/agendamentos`,
`GET/POST/PATCH` em `/api/agendamentos/:token*` (ver/cancelar/remarcar).

**Autenticadas** (`Authorization: Bearer <token>`) — `POST/GET/PUT
/api/auth/*` e `/api/negocios/me*`, CRUD de `/api/servicos` e
`/api/bloqueios`, `GET /api/agendamentos` (agenda do negócio).

**Interna** — `POST /api/internal/lembretes/processar` (protegida por
`LEMBRETES_SECRET`, não aparece no Swagger): varre agendamentos confirmados
pra amanhã sem lembrete enviado e manda e-mail. Pensada pra ser chamada 1x/dia
por um cron — ainda não configurado no ambiente de produção.

## Passo a passo para rodar

### 1. Banco (Neon)
1. Crie uma conta grátis em [neon.tech](https://neon.tech) e um projeto novo.
2. Dashboard → **Connect** → copie a connection string.

### 2. Variáveis de ambiente
```bash
cp .env.example .env
```
Preencha `DATABASE_URL` com a connection string da Neon. Gere valores
aleatórios para `JWT_SECRET` e `LEMBRETES_SECRET` (ex: `openssl rand -hex
32`). `RESEND_API_KEY` é opcional — sem ela, o serviço de e-mail só loga no
console (bom o suficiente pra dev).

### 3. Instalar, migrar, rodar
```bash
npm install
npm run prisma:migrate   # aplica o schema + a exclusion constraint na Neon
npm run dev
```
API em `http://localhost:3333`, docs em `http://localhost:3333/docs`.

### 4. Testes
```bash
npm test
```
Roda contra o mesmo banco configurado em `DATABASE_URL` (não há um banco de
teste isolado nesta fase — cada teste usa e-mail/slug únicos e limpa o que
criou no `afterAll`; ver nota abaixo).

> **Nota sobre os testes de integração**: por serem contra um banco real
> (não um banco de teste dedicado), evite rodá-los apontando pra um banco em
> uso por outra pessoa/aplicação. Um passo de produção natural seria migrar
> pra um schema/branch dedicado a testes (a Neon suporta branches de banco
> gratuitos, próximo passo óbvio quando o projeto crescer).

## Próximos passos (roadmap)

- [ ] Múltiplos profissionais por negócio, cada um com agenda própria
- [ ] Notificação via WhatsApp (hoje só e-mail)
- [ ] Página de avaliações/feedback pós-atendimento
- [ ] Relatório de faturamento por período (possível integração futura com o
      Vianova Gestão Financeira — ideia de ecossistema Vianova Dev)
- [ ] Branch de banco dedicada a testes/produção na Neon (hoje dev e
      produção compartilham o mesmo banco)
- [ ] Cron real na Render chamando
      `/api/internal/lembretes/processar` 1x/dia
- [ ] `RESEND_API_KEY` em produção pra lembretes por e-mail saírem de
      verdade (hoje só loga)
