# Evully

> Aplicativo desktop local para acompanhamento de treino, dieta,
> composição corporal, cardio, sono e hábitos, projetado desde o início
> para evoluir posteriormente para uma aplicação web e, em uma fase
> futura, para um produto SaaS comercial.

Este documento é a **especificação do produto** e a referência para todo o
desenvolvimento. Ele é versionado junto com o código e deve ser atualizado
sempre que uma decisão mudar.

**Fase atual:** V0.1 — Fundação + perfis + questionário de acompanhamento + peso + medidas + dashboard + backup + importação CSV.

**Licença:** proprietária, todos os direitos reservados ([LICENSE](LICENSE)).
**Segurança:** modelo e regras em [SECURITY.md](SECURITY.md).
**Design:** identidade visual e design system em [DESIGN.md](DESIGN.md).
**Arquitetura:** camadas, módulos e regras de código em [ARCHITECTURE.md](ARCHITECTURE.md).
**Frontend:** site, app web e apps Android/iOS em [FRONTEND.md](FRONTEND.md).
**Backend:** API, dados e sincronização em [BACKEND.md](BACKEND.md).

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Princípios do projeto](#2-princípios-do-projeto)
3. [Glossário](#3-glossário)
4. [Roadmap](#4-roadmap)
5. [Arquitetura e decisões técnicas](#5-arquitetura-e-decisões-técnicas)
6. [Convenções de dados](#6-convenções-de-dados)
7. [Regras de data e cálculo](#7-regras-de-data-e-cálculo)
8. [V0.1 — Fundação, perfis, peso e medidas](#8-v01--fundação-perfis-peso-e-medidas)
9. [V0.2 — Nutrição](#9-v02--nutrição)
10. [V0.3 — Treino](#10-v03--treino)
11. [V0.4 — Cardio e hábitos](#11-v04--cardio-e-hábitos)
12. [V0.5 — Sono](#12-v05--sono)
13. [V0.6 — Estatísticas e dashboard completo](#13-v06--estatísticas-e-dashboard-completo)
14. [V0.7 — Backup, restauração e exportação](#14-v07--backup-restauração-e-exportação)
15. [V0.8 a V1.0 — Polimento e distribuição Windows](#15-v08-a-v10--polimento-e-distribuição-windows)
16. [UX/UI](#16-uxui)
17. [Modelo de dados conceitual](#17-modelo-de-dados-conceitual)
18. [Testes](#18-testes)
19. [Critérios de aceite da Fase Desktop](#19-critérios-de-aceite-da-fase-desktop)
20. [Evully Intelligence](#20-evully-intelligence)
21. [Evully Coach AI](#21-evully-coach-ai)
22. [Evully Nutrition Intelligence](#22-evully-nutrition-intelligence)
23. [Composição corporal e percentual de gordura](#23-composição-corporal-e-percentual-de-gordura)
24. [Evully Health — exames laboratoriais](#24-evully-health--exames-laboratoriais)
25. [Evully Reminders](#25-evully-reminders)
26. [WhatsApp](#26-whatsapp)
27. [Privacidade, consentimento e dados sensíveis](#27-privacidade-consentimento-e-dados-sensíveis)
28. [Histórico e rastreabilidade](#28-histórico-e-rastreabilidade)
29. [Fase 2 — Aplicação Web](#29-fase-2--aplicação-web)
30. [Fase 3 — SaaS comercial](#30-fase-3--saas-comercial)
31. [O que NÃO fazer](#31-o-que-não-fazer)
32. [Prioridade e fluxo de desenvolvimento](#32-prioridade-e-fluxo-de-desenvolvimento)
33. [Questões em aberto](#33-questões-em-aberto)
34. [Objetivo final](#34-objetivo-final)
35. [Propriedade intelectual e licença](#35-propriedade-intelectual-e-licença)

---

## 1. Visão geral

O **Evully** deve começar como um aplicativo desktop simples, rápido,
confiável e totalmente local. A primeira finalidade é permitir que duas
pessoas da mesma residência utilizem o sistema — inicialmente Lucas e
sua esposa — mantendo perfis, objetivos, dieta, treino e histórico
completamente separados.

O objetivo do MVP não é criar imediatamente um SaaS, uma rede social
fitness ou um substituto de acompanhamento médico/nutricional. O
objetivo é resolver muito bem o acompanhamento diário de evolução física
e validar o produto por uso real.

A evolução planejada é:

1. **Desktop local** (Fase 1 — V0.x e V1.x)
2. **Aplicação Web** (Fase 2 — V2.x)
3. **Produto comercial / SaaS / PWA / aplicativos** (Fase 3 — V3.x)

A arquitetura da Fase 1 deve ser simples, mas não descartável. Modelos
de domínio, regras de negócio e componentes devem ser construídos de
forma que possam ser reaproveitados ou migrados nas fases seguintes.

---

## 2. Princípios do projeto

### 2.1 Local-first na Fase 1

- nenhum servidor é obrigatório;
- nenhuma conta online é obrigatória;
- nenhum serviço de nuvem é obrigatório;
- os dados ficam armazenados localmente;
- o aplicativo deve funcionar sem internet;
- o banco é SQLite;
- deve existir backup manual e automático (desde a V0.1) e restauração
  (a partir da V0.7);
- deve existir exportação em formatos abertos (V0.7).

### 2.2 Multi-perfil desde o início

Embora inicialmente existam apenas dois usuários, o banco NÃO deve
possuir campos ou tabelas específicos para "Lucas" ou "Esposa".

Errado:

```text
lucas_weight
wife_weight
```

Correto:

```text
profiles
body_weights
  profile_id
  measured_on
  weight_kg
```

Todas as entidades pessoais devem possuir relação com `profile_id`.

### 2.3 Simplicidade primeiro

Evitar na Fase 1:

- microsserviços;
- Kubernetes;
- autenticação online;
- pagamentos;
- Redis;
- filas distribuídas;
- infraestrutura cloud;
- IA generativa obrigatória;
- integrações desnecessárias;
- dependência de APIs externas para funções essenciais.

### 2.4 Dados pertencem ao usuário

O aplicativo deve permitir:

- backup;
- restauração;
- exportação JSON;
- exportação CSV quando aplicável;
- futura migração SQLite → PostgreSQL.

### 2.5 Um ou vários computadores

O Evully precisa funcionar nos dois cenários da casa:

- **Mesmo computador:** os perfis convivem no mesmo banco, separados por
  `profile_id`.
- **Computadores diferentes:** cada computador tem sua própria instalação
  e seu próprio banco, com o perfil de quem o usa.

Na Fase 1 não existe sincronização. Para levar um perfil de um computador
para outro, existe a **transferência de perfil** por arquivo (V0.7,
§14.4). Os UUIDs permitem importar sem conflito de IDs.

Não é suportado manter o arquivo `evully.db` em uma pasta sincronizada
(OneDrive, Google Drive, Dropbox) para dois computadores usarem ao mesmo
tempo: o SQLite pode corromper o banco nesse cenário. Pastas sincronizadas
servem apenas como **destino de backup** (§8.7).

### 2.6 Saúde e segurança

O aplicativo é uma ferramenta de registro e planejamento e não deve se
apresentar como médico, nutricionista ou fisioterapeuta.

Recomendações automáticas futuras devem ser conservadoras. Sintomas,
lesões, medicamentos, hormônios e decisões clínicas devem permanecer sob
responsabilidade de profissionais habilitados.

### 2.7 Cálculos determinísticos

Todo cálculo (médias, totais, macros, durações, progressões) é feito por
funções de domínio testáveis. IA nunca calcula; no máximo explica
resultados já calculados.

---

## 3. Glossário

A palavra "meta" era usada com sentidos diferentes. A partir deste
documento os termos são:

| Termo na interface | Significado | Tabela |
|---|---|---|
| **Perfil** | Pessoa que usa o app. | `profiles` |
| **Projeto** | Período com objetivo e prazo, ex.: "Shape de Praia, 05/10/2026 → 06/12/2026". | `projects` |
| **Meta nutricional** | Calorias, macros e água diários vigentes a partir de uma data. | `nutrition_targets` (V0.2) |
| **Meta corporal** | Valor-alvo de peso ou medida, opcionalmente ligado a um projeto. | `body_targets` (futuro) |
| **Objetivo** | Direção do projeto: perder gordura, ganhar massa, recomposição ou manter. | `projects.objective` |
| **Questionário de acompanhamento** | Perguntas que o usuário responde para configurar o próprio acompanhamento. | `profile_questionnaires` |
| **Configuração de acompanhamento** | O que o perfil acompanha e como o painel se apresenta, com histórico. | `tracking_configs` |
| **Área de foco** | Região do corpo que o usuário quer acompanhar (cintura, quadril, braços, pernas, tórax). | `tracking_configs.focus_areas` |
| **Direção** | Se subir, descer ou nenhum dos dois é favorável para um indicador, conforme o objetivo. | derivado (§7.6) |
| **Pesagem** | Um registro de peso. | `body_weights` |
| **Etiqueta** | Marcador opcional que explica uma pesagem (ex.: "Retenção"). | `tags` |
| **Sessão de medidas** | Um conjunto de medidas tomadas no mesmo momento. | `body_measurements` |
| **Tipo de medida** | Cintura, quadril, braço relaxado direito etc. | `measurement_types` |
| **Peso do dia** | Valor de peso considerado para um dia (ver §7.2). | derivado |

> A tabela antes chamada `goals` passa a se chamar `projects`.

---

## 4. Roadmap

Este é o **único** roadmap do projeto.

| Versão | Escopo |
|---|---|
| **V0.1** ✓ 0.1.0 (21/10/2026) | Fundação + perfis + questionário de acompanhamento + projetos + peso + medidas + dashboard adaptável + backup manual e automático + importação CSV |
| **V0.2** ✓ 0.2.0 (25/10/2026) | Nutrição: alimentos, refeições, metas nutricionais |
| **V0.3** ✓ 0.3.0 (26/10/2026) | Treino: exercícios, planos, execução, séries, progressão |
| **V0.4** ✓ 0.4.0 (27/10/2026) | Cardio + hábitos |
| **V0.5** ✓ 0.5.0 (28/10/2026) | Sono |
| **V0.6** ✓ 0.6.0 (09/11/2026) | Estatísticas e dashboard completo |
| V0.7 | Backup completo, restauração, exportação JSON/CSV e transferência de perfil entre computadores |
| V0.8 | UX/polimento |
| V1.0 | Desktop estável + instalador Windows (a atualização automática foi antecipada; §33) |
| V1.1 | Analytics Engine determinístico |
| V1.2 | Recommendation Engine determinístico |
| V1.3 | Notificações locais / Evully Reminders |
| V1.4 | Evully Health (estrutura local/manual) |
| V1.5 | Evully Coach AI opcional (desenvolvimento/testes) |
| V2.x | App web + site + PWA + API NestJS + autenticação + PostgreSQL + sincronização |
| V2.x | Evully Cloud + IA server-side |
| V2.x | WhatsApp oficial / push / e-mail |
| V3.x | SaaS comercial + planos + billing + apps nativos Android/iOS (React Native com Expo) |

Regras:

> Uma versão deve estar funcional, persistente e testável antes de a
> próxima ser iniciada.

> Dados confiáveis antes de analytics; analytics antes de recomendações;
> recomendações antes de IA; backend antes de integrações comerciais
> remotas.

A numeração pode ser ajustada, mas o princípio incremental permanece.

---

## 5. Arquitetura e decisões técnicas

### 5.1 Stack

| Área | Escolha | Motivo |
|---|---|---|
| Shell desktop | Electron (versão exata fixada) | Requisito do projeto. O electron-builder exige versão exata. |
| Build | electron-vite 5 + **Vite 7** | electron-vite 5 não suporta Vite 8; Vite fica fixado na 7. |
| UI | React + TypeScript | Reaproveitável na versão web. |
| Linguagem | **TypeScript 6.0.x** | typescript-eslint ainda não suporta TS ≥ 6.1. |
| Estilo | Tailwind CSS 4 + **shadcn/ui** (sobre Radix) | Mesmo design system no desktop, no web e no celular (ver [DESIGN.md](DESIGN.md)). |
| Ícones | Lucide | Traço consistente; licença ISC. |
| Monorepo | npm workspaces | Compartilhar tokens e componentes entre desktop, web e celular. |
| Banco | SQLite via **better-sqlite3** 13 | Síncrono, estável, rápido. Usa Node-API: o mesmo binário funciona no Node e no Electron, sem recompilar (`npmRebuild: false`). |
| Acesso a dados | **Kysely** | Query builder tipado, migrations embutidas, suporta PostgreSQL. |
| Validação | zod | Validação de toda entrada que atravessa o IPC. |
| Gráficos | Recharts | Simples e suficiente para séries temporais. |
| Roteamento | React Router (HashRouter) | Compatível com `file://` no app empacotado. |
| Testes | Vitest | Rodando com `ELECTRON_RUN_AS_NODE=1` para usar o mesmo binário do better-sqlite3. |
| Testes E2E | Playwright (suporte a Electron) | Fluxos críticos da §18.3 no app real. |
| Qualidade | ESLint + typescript-eslint + Prettier | — |
| Instalador | electron-builder (NSIS) | Gera `Evully-Setup.exe`. |

As versões exatas ficam fixadas no `package.json`. Qualquer troca de peça
desta tabela deve ser registrada aqui com o motivo.

### 5.2 Arquitetura

**Clean Architecture pragmática** organizada como **monólito modular**.
Os detalhes, a regra de dependência, a estrutura por módulo, as regras de
Clean Code e a verificação automática estão em
[ARCHITECTURE.md](ARCHITECTURE.md).

```text
Interface (React, processo renderer)
 ↓  IPC tipado (preload + contextBridge)
Adaptadores (handlers IPC, repositórios Kysely)   ← processo main
 ↓
Aplicação (casos de uso + ports)
 ↓
Domínio (packages/domain, funções puras)
```

- Domínio, casos de uso e adaptadores rodam no **processo main**.
- O renderer não acessa Node, arquivos nem banco. Ele só chama a API
  exposta pelo preload, com `contextIsolation` ativo e `nodeIntegration`
  desligado.
- Toda chamada IPC tem contrato tipado (`apps/desktop/src/shared/`, com
  schemas de `packages/contracts`) e entrada validada com zod no main.
- A regra de negócio NÃO fica em componentes React.
- Na Fase 2, a API NestJS reaproveita o mesmo domínio; o IPC é
  substituído por HTTP.

### 5.3 Estrutura do repositório

Monorepo com npm workspaces desde a V0.1. Cada pasta entra na fase em que
for necessária.

```text
EvullyApp/
  apps/
    desktop/            Electron: shell do desktop (V0.1)
    web/                React + Vite: app web / PWA (Fase 2)
    mobile/             React Native com Expo: apps Android e iOS (Fase 3)
    site/               Next.js: site público (Fase 2)
    api/                API NestJS (Fase 2, §29)
  packages/
    app-core/           lógica das telas sem visual: hooks, view models, textos (V0.1)
    app-web/            telas com shadcn/ui para desktop e web (V0.1)
    ui-native/          componentes React Native (Fase 3)
    api-client/         cliente HTTP da API (Fase 2)
    domain/             regras de negócio puras em TypeScript (V0.1)
    contracts/          schemas zod e tipos compartilhados (V0.1)
    tokens/             cores, fontes, espaçamentos (CSS + JSON) (V0.1)
    ui/                 componentes shadcn/ui + componentes Evully (V0.1)
```

Todo o projeto usa **TypeScript**: desktop, web, celular e backend
compartilham as mesmas regras (`packages/domain`) e os mesmos contratos
(`packages/contracts`). Um cálculo existe em um único lugar e produz o
mesmo resultado em todas as plataformas.

Estrutura interna de `apps/desktop`:

```text
apps/desktop/src/
  main/          bootstrap do Electron, janelas, composition root,
                 roteador IPC, caminhos, logs
  preload/       ponte segura entre main e renderer
  database/      conexão SQLite, schema tipado, migrations, seed
  shared/        mapa de canais IPC (usa schemas de packages/contracts)
  modules/       profiles, tracking, body, backup, settings…
    <módulo>/
      application/   casos de uso
      ports/         interfaces (repositórios, relógio…)
      adapters/      repositórios Kysely, handlers IPC
  renderer/      shell: monta packages/app-web com o cliente IPC
                 (IpcEvullyClient) e cuida do que é exclusivo do Electron
apps/desktop/tests/    testes de repositórios, migrations e fluxos
packages/domain/tests/ testes das regras de negócio
```

Documentação na raiz: `README.md` (especificação), `ARCHITECTURE.md`,
`FRONTEND.md`, `BACKEND.md`, `DESIGN.md`, `SECURITY.md`, `LICENSE`,
`CLAUDE.md` (guia do agente Claude Code, com skills em `.claude/skills/`) e, a partir do código,
`CHANGELOG.md` e `THIRD_PARTY_NOTICES`.

Regras:

- `packages/domain` é TypeScript puro: não depende de Electron, Node,
  React, NestJS nem de banco. Recebe dados e devolve resultados.
- `packages/contracts` contém os schemas zod usados para validar
  entradas no desktop (IPC), na API e nos formulários.
- `packages/app-core` contém a lógica das telas sem visual e obtém dados
  pela interface `EvullyClient`; cada plataforma fornece a implementação
  (IPC no desktop, HTTP na web, SQLite local com sincronização no
  celular). `packages/app-web` desenha essa lógica com shadcn/ui. Ver
  [FRONTEND.md](FRONTEND.md), §3.
- `packages/ui` e `packages/tokens` não dependem de Electron nem de
  Next.js. Componentes recebem dados por props.
- Componentes visuais reutilizáveis ficam em `packages/ui`; telas ficam
  em cada app.
- O CLI do shadcn/ui é configurado para gerar componentes em
  `packages/ui`.

### 5.4 Diretório de dados

Os dados ficam fora da pasta de instalação, em `app.getPath('userData')`
(no Windows, `%APPDATA%\Evully`):

```text
evully.db
backups/
logs/
photos/        (futuro)
attachments/   (futuro)
```

Em desenvolvimento, o app usa um diretório separado (`Evully-dev`),
definido antes de abrir o banco. Seed, testes manuais e experimentos
nunca tocam nos dados reais. Os testes automatizados usam bancos em
memória ou temporários.

### 5.5 Padrões de implementação

| Tema | Padrão |
|---|---|
| Montagem das dependências | **Composition root manual** em `main/composition-root.ts`, sem container de DI. Casos de uso dependem de *ports* (interfaces), o que permite testes com implementações falsas. Na API, os módulos NestJS fazem esse papel (ver [ARCHITECTURE.md](ARCHITECTURE.md), §4.3). |
| IPC | **Mapa de canais tipado** em `shared/`, nomeado por módulo e ação (ex.: `'body:register-weight'` → entrada/saída). Cada canal usa um schema zod de `packages/contracts`; os handlers são registrados a partir do mapa. O renderer usa uma API tipada (`api.body.registerWeight(...)`). Não existe canal genérico de SQL ou de arquivos. |
| Erros | Domínio e casos de uso lançam erros tipados (`ValidationError`, `NotFoundError`, `ConflictError`). A camada IPC converte para `{ ok: true, data }` ou `{ ok: false, error: { code, message } }`. Stack traces vão para o log, nunca para a tela. |
| Dados no renderer | **TanStack Query** para cache, carregamento e invalidação após gravações. |
| Formulários | **react-hook-form + zod**, reaproveitando os schemas de `packages/contracts`. A validação é escrita uma vez e roda na tela, no IPC e, na Fase 2, na API. |
| Tempo | Um port `Clock` injetado nos casos de uso. Nenhuma regra chama `new Date()` diretamente, para que "hoje" seja controlável nos testes. |
| Logs | **electron-log** em `%APPDATA%\Evully\logs`, com rotação. Mensagens não contêm dados pessoais (peso, medidas, nomes). |

Exemplo de fluxo — registrar peso:

```text
WeightForm (react-hook-form + schema zod de packages/contracts)
  → api.body.registerWeight()           renderer
  → preload → IPC 'body:register-weight'
  → handler IPC valida com o mesmo schema   adapter (main)
  → RegisterWeight.execute()            caso de uso: regras de packages/domain
  → WeightRepository.insert()           port → KyselyWeightRepository (SQLite)
  ← { ok: true, data }                  TanStack Query atualiza dashboard e lista
```

### 5.6 Ferramentas e fluxo de trabalho

| Tema | Padrão |
|---|---|
| Node.js | Versão LTS ativa, fixada em `.nvmrc` e em `engines` do `package.json`. |
| Gerenciador de pacotes | npm, com `package-lock.json` versionado. |
| Formatação | Prettier, aplicado no CI e no editor. |
| Commits | Conventional Commits (`feat:`, `fix:`, `docs:`…). |
| Versões | SemVer alinhado ao roadmap (`0.1.0` = V0.1) e `CHANGELOG.md` no formato Keep a Changelog. |
| Branches | `main` sempre estável; trabalho em branches `feat/…` e `fix/…` integradas por pull request. |
| CI | GitHub Actions em `windows-latest`: lint, typecheck, testes, verificação de licenças, `npm audit` e build. |
| Backlog | Milestones por versão e uma issue por história de usuário no GitHub. |

### 5.7 Requisitos não funcionais (Fase 1)

| Requisito | Meta |
|---|---|
| Sistema | Windows 10 e 11, 64 bits. |
| Resolução mínima | 1280 × 720, com layout utilizável até 1024 px de largura. |
| Abertura | Até 3 s até a tela de seleção de perfil em um computador comum. |
| Operações | Gravações e consultas da V0.1 em até 200 ms com 5 anos de dados. |
| Offline | Todas as funções da Fase 1 funcionam sem internet. |
| Idioma | Português do Brasil (§16.1). |

### 5.8 Segurança

O modelo de ameaças, as camadas de proteção (Electron, IPC, banco,
segredos, logs, dependências, distribuição) e o checklist por versão
estão em [SECURITY.md](SECURITY.md). Toda mudança de código deve
respeitá-lo.

---

## 6. Convenções de dados

### 6.1 Colunas padrão

Toda tabela possui, salvo indicação em contrário:

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | UUID v7 (`TEXT` no SQLite, `uuid` no PostgreSQL) | Chave primária gerada pela aplicação. Ordenada pelo tempo, o que mantém índices eficientes no PostgreSQL, e permite sincronizar sem conflito de IDs. |
| `created_at` | TEXT (ISO 8601, UTC) | Preenchido na criação. |
| `updated_at` | TEXT (ISO 8601, UTC) | Atualizado em toda alteração. |
| `deleted_at` | TEXT (ISO 8601, UTC), nulo | Soft delete em entidades com dados do usuário. |

Toda tabela com dados pessoais possui `profile_id` com chave estrangeira
para `profiles`. As seções seguintes descrevem apenas as colunas
específicas de cada tabela.

Exceções:

- **Catálogos do sistema** (ex.: `measurement_types`): sem `profile_id`
  e sem `deleted_at`; desativados com `is_active`.
- **Catálogo da casa** (`foods`): sem `profile_id`, compartilhado entre
  os perfis do computador; tem soft delete. O que é pessoal (refeições,
  registros, metas, água) fica em tabelas com `profile_id`.
- **Tabelas de ligação** (ex.: `body_weight_tags`): sem `updated_at` e
  sem `deleted_at`; a ligação é criada ou removida.
- **Tabelas de histórico** (`tracking_configs`, `profile_questionnaires`,
  `nutrition_targets`, `cardio_targets`): somente inserção. Registros nunca são editados
  nem excluídos pela interface.

Restrições de unicidade com coluna que pode ser nula (ex.:
`settings.profile_id`) ou que ignoram registros excluídos usam **índices
parciais**, porque no SQLite valores `NULL` não colidem em `UNIQUE`.

### 6.2 Datas

- **Data local** (o dia do calendário do usuário): `TEXT` no formato
  `YYYY-MM-DD`, colunas com sufixo `_on` ou `_date`.
- **Instante**: `TEXT` ISO 8601 em UTC, colunas com sufixo `_at`.
- O fuso usado para converter instante em data local é o do sistema
  operacional. Na Fase 2 o fuso passa a ser uma configuração do perfil.

### 6.3 Unidades e números

- Peso é sempre gravado em **kg** e medidas em **cm**.
- A unidade preferida do perfil afeta apenas a exibição.
- Valores decimais são arredondados no domínio antes de gravar: peso com
  2 casas e medidas com 1 casa. A exibição usa 1 casa.
- Limites de validação: peso entre 20 e 400 kg; medidas entre 5 e 300 cm.

### 6.4 Integridade

- `PRAGMA foreign_keys = ON` em toda conexão.
- Modo WAL.
- Migrations versionadas, aplicadas automaticamente na abertura do app.
  Uma migration publicada nunca é editada; correções viram nova migration.
- Antes de aplicar migrations pendentes em um banco existente, é criado
  um backup automático.
- Operações que tocam mais de uma tabela rodam em transação.
- Índices em `(profile_id, data)` para tabelas de registros.
- Exclusões feitas pela interface são soft delete e exigem confirmação.
- Toda consulta de dados pessoais filtra por `profile_id` no repositório.

---

## 7. Regras de data e cálculo

Todas as regras abaixo são implementadas em `packages/domain` e possuem testes.

### 7.1 Projeto

- **Dia atual** = `(hoje − start_date) + 1`. O dia inicial é o dia 1.
- **Total de dias** = `(target_date − start_date) + 1`.
  Exemplo: 05/10/2026 → 06/12/2026 = **63 dias**.
- **Dias até a meta** = `target_date − hoje`.
- Antes do início, exibir "Começa em N dias". Depois do prazo, exibir
  "Prazo encerrado".
- Cada perfil tem no máximo **um projeto ativo**. O projeto atual é o
  projeto ativo. Para criar outro, o atual precisa ser concluído ou
  arquivado.
- Ao concluir um projeto, o app oferece refazer o questionário de
  acompanhamento.
- Alterar as datas de um projeto apenas recalcula os indicadores; nenhum
  registro é alterado.

#### 7.1.1 Registros retroativos

Pesagens e medidas podem ser registradas com data passada (ex.: dados
anotados antes de o app existir), mas nunca com data futura.

### 7.2 Peso

- Podem existir **várias pesagens no mesmo dia**.
- **Peso do dia** = a pesagem mais recente (`measured_at`) daquele dia.
- **Peso atual** = peso do dia mais recente registrado.
- **Peso inicial** = peso do primeiro dia com pesagem dentro do projeto
  atual. Sem projeto, é o primeiro peso do dia do perfil.
- **Diferença** = peso atual − peso inicial.
- **Média móvel de 7 dias** para o dia D = média dos pesos do dia
  existentes no intervalo de D−6 a D (dias corridos). Só é exibida se
  houver pesagem em pelo menos **3** dias desse intervalo; caso contrário,
  "dados insuficientes".
- Uma pesagem isolada nunca dispara alertas ou mudanças (ver §20).

### 7.3 Medidas

- **Última medida** de um tipo = valor da sessão de medidas mais recente
  que contém aquele tipo.
- **Diferença** de um tipo = última medida − primeira medida daquele tipo
  dentro do projeto atual.
- Medidas desativadas no perfil deixam de aparecer, mas seu histórico é
  preservado e volta a aparecer se forem reativadas.

### 7.4 Idade

Calculada a partir de `birth_date` na data de referência. Nunca é gravada.

### 7.5 Configuração vigente

A configuração de acompanhamento vigente em uma data D é o registro de
`tracking_configs` com maior `effective_from` ≤ D (desempate pelo
`created_at` mais recente). Análises de datas passadas usam a
configuração vigente naquela data.

### 7.6 Direção dos indicadores

A cor de uma variação depende do objetivo do projeto atual:

| Indicador | Perder gordura | Ganhar massa | Recomposição | Manter / saúde |
|---|---|---|---|---|
| Peso | ↓ favorável | ↑ favorável | neutro | neutro |
| Cintura, abdômen | ↓ favorável | neutro | ↓ favorável | neutro |
| Quadril | neutro | ↑ favorável | neutro | neutro |
| Braços, pernas, tórax | neutro | ↑ favorável | ↑ favorável | neutro |
| Pescoço | neutro | neutro | neutro | neutro |

- **Favorável**: verde. **Contrária**: âmbar suave, nunca vermelho, e sem
  mensagens alarmistas. **Neutra**: cinza.
- Variações com valor absoluto menor que 0,1 são exibidas como "estável".
- A cor nunca é a única informação: sempre há seta e valor com sinal.
- Sem projeto ativo, todos os indicadores são neutros.

### 7.7 Sono (V0.5)

- Uma noite de sono pertence ao **dia em que a pessoa acorda**
  (`sleep_date` = data local de `wake_time`).
- `duration_minutes` é sempre derivado de `sleep_time` (ou `bed_time`,
  se `sleep_time` estiver vazio) até `wake_time`. É gravado para facilitar
  consultas, mas só o caso de uso o calcula; nunca é editado diretamente.

---

## 8. V0.1 — Fundação, perfis, peso e medidas

### 8.1 Fluxo inicial

```text
Abrir Evully
      ↓
Quem está usando?  ──── + Adicionar perfil
      ↓                        ↓
      ↓              Questionário de acompanhamento (§8.2)
      ↓              passo 1 obrigatório, demais opcionais
      ↓                        ↓
      └──────────→  Dashboard
```

Tela inicial:

```text
Quem está usando?

[ Lucas ]
[ + Adicionar perfil ]
```

Na primeira abertura do app, um **aviso de saúde** é exibido e precisa ser
confirmado uma vez por instalação: o Evully é uma ferramenta de registro
e planejamento e não substitui médico, nutricionista ou educador físico.
O texto fica disponível depois em Configurações — Sobre.

Regras de privacidade entre perfis:

- A tela de seleção mostra **apenas nome e avatar**, nunca dados (peso,
  medidas, projeto).
- Após um período sem uso, o app volta para a tela de seleção.
  Padrão: 15 minutos; configurável ou desligável em Configurações.
- Não há login nem senha na Fase 1. Perfis separam os dados, mas **não
  são uma barreira de segurança**: quem usa a conta do Windows acessa
  todos os perfis (ver [SECURITY.md](SECURITY.md)). Um PIN opcional é
  questão em aberto (§33).

### 8.2 Questionário de acompanhamento

O usuário configura o próprio acompanhamento respondendo a um
questionário curto. As respostas passam por **regras determinísticas**
que geram uma **proposta de configuração**. O app se adapta ao perfil e
ao objetivo, sem IA e sem padrões fixos por sexo.

```text
Respostas
   ↓
Regras determinísticas (packages/domain, versionadas e testadas)
   ↓
Proposta: "Seu Evully ficará assim"
   ↓  [Aceitar]  [Ajustar]
Configuração de acompanhamento do perfil (com histórico)
   ↓
Dashboard, medidas e gráficos se adaptam
```

Princípios:

- **Opcional a partir do passo 2.** É possível pular e configurar tudo
  manualmente depois; nesse caso valem os padrões da §8.2.3. Os passos 2
  e 3 criam o projeto e são respondidos juntos: pular um pula o outro.
- **Proposta, não imposição.** Nada é aplicado sem o usuário aceitar a
  proposta, e tudo pode ser alterado depois.
- **Pode ser refeito** a qualquer momento, e é oferecido novamente quando
  um projeto termina. Cada nova configuração gera histórico (§28).
- **Só configura o que a versão atual tem.** Recursos futuros aparecem
  apenas como interesse, identificados como "em breve" (§8.2.4). Quando
  um módulo novo for lançado (nutrição, treino, ciclo…), o app oferece as
  perguntas daquele módulo, sem refazer o questionário inteiro.
- **Sexo nunca restringe.** Ele apenas pré-seleciona sugestões; qualquer
  opção fica disponível para qualquer perfil.
- **Sem perguntas clínicas** (doenças, medicamentos, gestação) na Fase 1.
- A configuração é **dado (JSON), não código**. O mesmo formato será
  usado por modelos criados por profissionais no futuro (§30.5).

#### 8.2.1 Perguntas da V0.1

| Passo | Pergunta | Respostas | O que configura |
|---|---|---|---|
| 1 | Dados básicos (**obrigatório**; só o nome é exigido) | Nome, data de nascimento, sexo (opcional), altura | `profiles` |
| 2 | Qual é o seu objetivo agora? | Perder gordura · Ganhar massa · Recomposição (perder gordura e ganhar massa) · Manter / saúde | `projects.objective` e a **direção** dos indicadores (§7.6) |
| 3 | Dê um nome e um prazo ao seu projeto | Nome, início, prazo | `projects` |
| 4 | Quais áreas do corpo você quer acompanhar? | Múltipla escolha: Barriga/cintura · Quadril/glúteos · Braços · Pernas · Tórax/costas | Medidas acompanhadas e sua ordem |
| 5 | Como você prefere ver o seu peso? | Tendência (recomendado) · Peso do dia · Prefiro não ver o peso no painel | `weight_display` |
| 6 | Recursos em breve: o que você gostaria de usar? (opcional) | Ver §8.2.4 | Registra interesse; nada é ativado agora |
| 7 | Tem algo que você gostaria de acompanhar e não encontrou? (opcional) | Texto livre | `profile_questionnaires.answers` — sugestão de produto, não altera a configuração |
| — | Resumo | "Seu Evully ficará assim: …" | [Aceitar] / [Ajustar] |

#### 8.2.2 Regras da V0.1 (`tracking-rules@1`)

**Áreas de foco → medidas** (na ordem em que as áreas foram escolhidas):

| Área de foco | Medidas ativadas |
|---|---|
| Barriga/cintura | Cintura, Abdômen |
| Quadril/glúteos | Quadril |
| Braços | Braço relaxado D/E; Bíceps contraído D/E quando o objetivo for ganhar massa ou recomposição |
| Pernas | Coxa D/E, Panturrilha D/E |
| Tórax/costas | Tórax/busto |

- **Cintura** vem pré-selecionada para qualquer objetivo, porque é a
  medida mais útil para acompanhar mudança de gordura corporal. O usuário
  pode desmarcar.
- Se nenhuma área for escolhida, o perfil acompanha apenas a cintura.

**Exibição do peso:**

| Resposta | Painel |
|---|---|
| Tendência | Número principal = média de 7 dias; peso do dia em destaque secundário. |
| Peso do dia | Número principal = peso do dia; média de 7 dias em destaque secundário. |
| Prefiro não ver | Painel sem peso; destaca as medidas. A página Peso continua acessível normalmente. |

**Etiquetas padrão** criadas para o perfil (§8.3, `tags`): Retenção,
Refeição salgada, Pós-treino, Viagem, Doente. Se o sexo informado for
feminino, "Ciclo menstrual" também é sugerida. Todas podem ser editadas,
removidas ou criadas.

#### 8.2.3 Padrões quando o questionário é pulado

Nenhum projeto é criado (o painel convida a criar um e todos os
indicadores ficam neutros, §7.6), a medida acompanhada é a cintura e o
peso é exibido em tendência. O questionário fica disponível em
Configurações — Acompanhamento.

#### 8.2.4 Recursos em breve (passo 6)

Perguntas de interesse sobre recursos que ainda não existem. As respostas
ficam em `answers` e servem para priorizar o roadmap e, quando o recurso
for lançado, **oferecer** a ativação a quem demonstrou interesse. Nada é
ativado automaticamente, e dados sensíveis exigem consentimento explícito
no momento da ativação.

| Pergunta | Exibição | Respostas |
|---|---|---|
| Você gostaria de acompanhar o **ciclo menstrual** para entender variações de peso? | Exibida quando o sexo é feminino ou não informado. Para os demais perfis, fica disponível em Configurações — Acompanhamento. | Sim · Não · Talvez depois |
| Você gostaria de registrar **fotos de progresso**? | Todos os perfis | Sim · Não · Talvez depois |
| Você gostaria de proteger seu perfil com um **PIN**? | Todos os perfis | Sim · Não |
| Onde você prefere **registrar o peso**? | Todos os perfis | Computador · Celular · Tanto faz |

Na versão em que cada recurso for lançado, o app mostra uma vez, a quem
respondeu "Sim" ou "Talvez depois": "O recurso X chegou. Deseja ativar?".

### 8.3 Tabelas

#### `profiles`

| Coluna | Regra |
|---|---|
| `name` | Obrigatório. |
| `birth_date` | Opcional. Usada para idade e, no futuro, TMB. |
| `sex` | Opcional: `male`, `female` ou nulo. Só pré-seleciona sugestões e, no futuro, alimenta fórmulas. |
| `height_cm` | Opcional. |
| `avatar_path` | Opcional. Caminho relativo ao diretório de dados. |
| `unit_system` | `metric` (padrão). Afeta apenas exibição. |

#### `projects`

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `name` | Obrigatório. |
| `objective` | `fat_loss`, `muscle_gain`, `recomposition`, `maintenance`. |
| `start_date` | Obrigatória. |
| `target_date` | Obrigatória, maior ou igual a `start_date`. |
| `status` | `active`, `completed`, `archived`. No máximo um `active` por perfil. |
| `notes` | Opcional. |

#### `profile_questionnaires`

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `questionnaire_code` | Ex.: `tracking`. Módulos futuros terão seus próprios códigos. |
| `questionnaire_version` | Versão das perguntas respondidas. |
| `answers` | JSON com as respostas. |
| `status` | `completed` ou `skipped`. |
| `completed_at` | Instante. |

#### `tracking_configs`

Configuração de acompanhamento vigente a partir de uma data. Uma
alteração cria um novo registro; os anteriores nunca são editados.

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `effective_from` | Data local a partir da qual vale. A vigente é a de maior `effective_from` ≤ hoje (desempate por `created_at`). |
| `weight_display` | `trend`, `daily`, `hidden`. |
| `focus_areas` | JSON, lista ordenada: `waist`, `hips`, `arms`, `legs`, `chest`. |
| `enabled_modules` | JSON, lista de módulos opcionais ligados. Vazia na V0.1. |
| `source` | `questionnaire`, `manual`, `template`, `professional`. |
| `rule_version` | Ex.: `tracking-rules@1`. Nulo quando `source = manual`. |
| `questionnaire_id` | FK opcional para `profile_questionnaires`. |

#### `profile_measurement_types`

Medidas que cada perfil acompanha e em que ordem aparecem.

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `measurement_type_id` | FK para `measurement_types`. |
| `sort_order` | Ordem no formulário e no painel. |
| `is_active` | Desativar uma medida esconde o campo, mas preserva o histórico. |

Único por `(profile_id, measurement_type_id)`.

#### `body_weights`

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `measured_on` | Data local da pesagem. |
| `measured_at` | Instante da pesagem. |
| `weight_kg` | Obrigatório, 20–400. |
| `notes` | Opcional. |

#### `tags` e `body_weight_tags`

Etiquetas opcionais que explicam variações (ex.: "Retenção").

| Tabela | Colunas |
|---|---|
| `tags` | `profile_id`, `name` (único por perfil entre os não excluídos), `sort_order` |
| `body_weight_tags` | `body_weight_id`, `tag_id` — único por par |

#### `measurement_types`

Catálogo do sistema, sem `profile_id` e sem `deleted_at`.

| Coluna | Regra |
|---|---|
| `code` | Único. Ex.: `waist`. |
| `name` | Nome exibido. |
| `body_region` | `waist`, `hips`, `arms`, `legs`, `chest`, `other`. Usado pelas regras de foco. |
| `unit` | `cm`. |
| `instructions` | Como medir, exibido como dica no formulário. |
| `csv_name` | Nome da coluna nos modelos de importação CSV, em português sem acentos (ex.: `cintura`). Único. |
| `sort_order` | Ordem padrão. |
| `is_active` | Tipos inativos não podem ser escolhidos (para descontinuar um tipo sem apagar histórico). |

Tipos iniciais (criados pela migration):

| code | Nome | Região | Como medir |
|---|---|---|---|
| `waist` | Cintura | waist | Parte mais estreita do tronco, entre as costelas e o umbigo, ao fim de uma expiração normal. |
| `abdomen` | Abdômen | waist | Na altura do umbigo, com o abdômen relaxado. |
| `hips` | Quadril | hips | Parte mais larga dos glúteos, em pé com os pés juntos. |
| `chest` | Tórax/busto | chest | Parte mais larga do tórax, na linha dos mamilos, braços relaxados. |
| `right_arm` | Braço relaxado direito | arms | Ponto médio entre ombro e cotovelo, braço solto ao lado do corpo. |
| `left_arm` | Braço relaxado esquerdo | arms | Idem, lado esquerdo. |
| `right_biceps` | Bíceps contraído direito | arms | Ponto mais alto do bíceps, braço flexionado e contraído. |
| `left_biceps` | Bíceps contraído esquerdo | arms | Idem, lado esquerdo. |
| `right_thigh` | Coxa direita | legs | Ponto médio entre a virilha e o joelho, em pé. |
| `left_thigh` | Coxa esquerda | legs | Idem, lado esquerdo. |
| `right_calf` | Panturrilha direita | legs | Parte mais larga da panturrilha, em pé. |
| `left_calf` | Panturrilha esquerda | legs | Idem, lado esquerdo. |
| `neck` | Pescoço | other | Logo abaixo do pomo de adão, olhando para a frente. |

Dicas gerais exibidas no formulário: medir sempre no mesmo horário
(de preferência pela manhã, em jejum), com a fita rente à pele sem
apertar, e do mesmo lado do corpo.

Tipos personalizados por perfil ficam para depois. Quando existirem,
o catálogo ganhará uma coluna `profile_id` (nula = tipo do sistema).

#### `body_measurements`

Uma sessão de medidas.

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `measured_on` | Data local. |
| `measured_at` | Instante. |
| `notes` | Opcional. |

#### `body_measurement_values`

| Coluna | Regra |
|---|---|
| `measurement_id` | FK para `body_measurements`. |
| `measurement_type_id` | FK para `measurement_types`. |
| `value_cm` | 5–300. |

Único por `(measurement_id, measurement_type_id)`. Uma sessão precisa ter
pelo menos um valor; nenhum campo é obrigatório individualmente.

#### `settings`

| Coluna | Regra |
|---|---|
| `profile_id` | Nulo para configurações globais. |
| `key` | Ex.: `theme`, `inactivity_lock_minutes`. |
| `value` | JSON em texto. |

Único por `(profile_id, key)`.

### 8.3.1 Exclusão de perfil

- **Arquivar perfil** (padrão): soft delete. O perfil some da tela de
  seleção, os dados são preservados e ele pode ser restaurado em
  Configurações.
- **Apagar definitivamente**: só para perfis já arquivados. Exige digitar
  o nome do perfil para confirmar (maiúsculas e espaços nas pontas não
  importam), cria um backup antes (`kind = pre-delete`) e remove todos os
  dados do perfil em uma transação. Se o backup falhar, nada é apagado. É a
  única exclusão física do app.

### 8.4 Telas

| Tela | Conteúdo |
|---|---|
| Seleção de perfil | Nomes e avatares + "Adicionar perfil". Nenhum dado pessoal. |
| Cadastro/edição de perfil | Campos de `profiles`. |
| Configurações — Perfil | Arquivar o perfil atual; restaurar e apagar definitivamente perfis arquivados (§8.3.1). |
| Questionário de acompanhamento | Passos da §8.2.1 e resumo com Aceitar/Ajustar. |
| Dashboard | Ver §8.5. |
| Peso | Registrar, editar e excluir pesagens; etiquetas; lista; gráfico. |
| Medidas | Registrar sessão com as medidas do perfil (com dicas de como medir); histórico; gráfico por medida. |
| Configurações — Acompanhamento | Objetivo, áreas de foco, medidas acompanhadas e ordem, exibição do peso, etiquetas, refazer questionário. |
| Configurações — Projeto | Criar, editar e concluir projeto. |
| Configurações — Geral | Tema (igual ao Windows, claro ou escuro), retorno à seleção de perfil por inatividade (nunca, 5, 15 ou 30 min), backup (manual, automático, pasta adicional, último backup) e restauração (§14.2, desde a V0.7). |
| Configurações — Sobre | Versão do app, aviso de saúde, licença e avisos de terceiros. |
| Importar CSV | Escolher arquivo, pré-visualizar, ver erros e confirmar. Acessível pelas telas Peso e Medidas. |

No topo de todas as telas: `Perfil atual: Lucas ▼`. Trocar de perfil
nunca mistura registros.

### 8.5 Dashboard V0.1

O painel se adapta à configuração do perfil. Exemplos:

**Perfil A** — objetivo *perder gordura*, peso em *tendência*, foco em
barriga, braços e pernas:

```text
SHAPE DE PRAIA
Dia 18 de 63 · faltam 45 dias

Tendência de peso    90,1 kg   ▼ 1,9 kg      (verde)
Peso de hoje         89,8 kg
Peso inicial         92,0 kg

Cintura              93,4 cm   ▼ 2,6 cm      (verde)
Braço relaxado D     38,0 cm   — 0,0 cm      (neutro)
Coxa D               59,5 cm   ▼ 0,5 cm      (neutro)
```

**Perfil B** — objetivo *recomposição*, peso *oculto*, foco em quadril e
barriga:

```text
PROJETO VERÃO
Dia 18 de 63 · faltam 45 dias

Cintura              71,0 cm   ▼ 1,5 cm      (verde)
Quadril              98,0 cm   ▲ 0,5 cm      (neutro)
Abdômen              80,2 cm   ▼ 1,0 cm      (verde)
```

Regras:

- Mostra até **3 medidas**, as primeiras na ordem do perfil.
- A variação é calculada desde o início do projeto (§7.3) e colorida
  conforme a direção do objetivo (§7.6).
- Sem projeto ativo, o painel convida a criar um.
- Sem dados suficientes, cada indicador mostra "dados insuficientes" em
  vez de zero.

### 8.6 Gráficos

- Peso do dia e média móvel de 7 dias no mesmo gráfico, com marcadores
  nas pesagens que têm etiquetas;
- uma medida por vez ao longo do tempo, com seletor entre as medidas do
  perfil (padrão: a primeira da ordem).

### 8.7 Backup

#### 8.7.1 Backup manual

- Botão "Fazer backup agora" em Configurações.
- O banco é copiado com `VACUUM INTO` (nunca copiando o arquivo aberto).
- Gera `evully-backup-YYYY-MM-DD-HHMM.zip` contendo:

```text
evully.db
manifest.json   { app_version, schema_version, created_at, kind, sha256 }
```

- O usuário escolhe a pasta de destino. Um arquivo existente nunca é
  sobrescrito sem confirmação.

#### 8.7.2 Backup automático

- Ligado por padrão. Executado **ao fechar o app**, no máximo uma vez por
  dia, e sempre antes de migrations e de "Apagar perfil
  definitivamente".
- Destino padrão: `%APPDATA%\Evully\backups`. O usuário pode definir
  **uma pasta adicional**, por exemplo dentro do OneDrive, para ter uma
  cópia fora do disco do computador.
- Mantém as **últimas 10 cópias** automáticas (configurável). A limpeza
  só remove arquivos criados pelo backup automático (`kind = automatic`
  no manifesto), nunca backups manuais.
- Se o backup falhar, o app registra em log e avisa na próxima abertura,
  sem impedir o fechamento.
- Configurações mostra a data do último backup bem-sucedido.

#### 8.7.3 Restauração

Desde a V0.7 (0.7.0-alpha.1), pelo próprio app em Configurações — Geral
(§14.2). O passo a passo manual da V0.1 saiu de Configurações — Sobre.

### 8.8 Importação CSV

Permite trazer dados anotados antes do app (ex.: o projeto "Shape de
Praia" começou em 05/10/2026) ou de planilhas.

Arquivos aceitos, importados **para o perfil atual**:

```text
pesos.csv
data;hora;peso_kg;observacao
05/10/2026;07:10;92,0;
06/10/2026;;91,6;após viagem

medidas.csv
data;cintura;abdomen;quadril;torax;biceps_contraido_d;...
05/10/2026;;96;109;115;42
```

Regras:

- Separador `;` (padrão, decimal com vírgula) ou `,` (decimal com
  ponto). O separador é detectado pelo cabeçalho. Data `DD/MM/AAAA` ou
  `AAAA-MM-DD`. Codificação UTF-8 (com ou sem BOM).
- Colunas de medidas usam o `csv_name` (ex.: `cintura`,
  `biceps_contraido_d`) ou o `code` (ex.: `waist`) do catálogo (§8.3);
  células vazias são ignoradas. Medidas importadas que o perfil não acompanha são
  ativadas para ele.
- `hora` e `observacao` são opcionais. Sem hora, usa-se 12:00 local.
- As mesmas validações do formulário (limites, sem data futura, §7.1.1).
- **Pré-visualização obrigatória** antes de gravar: quantas linhas serão
  importadas, quais têm erro (com número da linha e motivo) e quais
  parecem duplicadas (mesma data e mesmo valor já existentes), que são
  ignoradas por padrão.
- Gravação em **uma transação**: ou tudo que foi aprovado entra, ou nada.
- O app oferece **modelos de CSV** para baixar.

### 8.9 Seed de desenvolvimento

Executado apenas por comando de desenvolvimento, sobre o banco de
desenvolvimento (§5.4), nunca no app instalado.

```text
Perfil:      Lucas · masculino · 175 cm · nascido em 16/08/1994
Projeto:     Shape de Praia · perder gordura · 05/10/2026 → 06/12/2026 · ativo
Acompanh.:   foco em barriga, braços, pernas, tórax, quadril · peso em tendência
Peso:        92,0 kg em 05/10/2026
Medidas em 05/10/2026:
  Abdômen 96 · Tórax 115 · Bíceps contraído D 42 · Bíceps contraído E 42,5
  Coxa D 60 · Coxa E 61 · Quadril 109
```

As medidas acompanhadas do seed seguem as regras da §8.2.2 e, além
delas, incluem Bíceps contraído D/E por ajuste manual (`source = manual`),
porque o objetivo "perder gordura" não as ativa automaticamente.

O segundo perfil não é criado pelo seed; ele é criado pela interface,
passando pelo questionário.

As metas nutricionais do seed estão em §9.7 e entram na V0.2.

### 8.10 Critérios de aceite V0.1

1. O aplicativo abre no Windows.
2. O usuário cria dois perfis.
3. Ao criar um perfil, o usuário responde ao questionário (ou pula) e
   aceita a proposta de configuração.
4. Perfis com respostas diferentes veem medidas e painéis diferentes.
5. O usuário alterna entre perfis, e a tela de seleção não mostra dados.
6. Dados de um perfil não aparecem no outro.
7. O usuário registra, edita e exclui pesagens, com etiquetas.
8. O usuário registra medidas, vendo apenas as do seu perfil.
9. O usuário altera a configuração de acompanhamento, e o histórico de
   configurações é preservado.
10. Os dados permanecem após reiniciar.
11. O dashboard mostra o peso conforme `weight_display` e a evolução
    básica colorida pela direção do objetivo.
12. O banco SQLite é criado automaticamente.
13. As migrations funcionam e são testadas.
14. Erros básicos são tratados e registrados em log.
15. Existe backup manual, e o backup automático roda ao fechar o app e
    mantém as últimas cópias.
16. O usuário importa pesos e medidas por CSV, com pré-visualização e
    relatório de erros.
17. O aviso de saúde é exibido na primeira abertura.
18. Após o tempo de inatividade, o app volta à seleção de perfil.
19. O usuário arquiva e restaura um perfil sem perder dados.
20. As regras de fronteira da arquitetura passam no CI
    ([ARCHITECTURE.md](ARCHITECTURE.md), §8).

Não começar nutrição ou treino antes de esse núcleo estar confiável.

---

## 9. V0.2 — Nutrição

### 9.1 Objetivo

Permitir planejar e registrar alimentação sem transformar o aplicativo em
uma plataforma nutricional complexa.

### Questionário do módulo

Ao ativar o módulo, o app oferece perguntas próprias (§8.2), por exemplo:
número de refeições por dia, restrições alimentares declaradas pelo
usuário (sem perguntas clínicas) e se deseja acompanhar água. As regras
correspondentes configuram as refeições padrão e o painel.

Na V0.2 (`nutrition@1`, em `profile_questionnaires` com código
`nutrition`):

- Aparece na primeira abertura da Dieta de cada perfil; pode ser pulado
  (padrão: todas as refeições e água ligada) e refeito em Configurações —
  Nutrição. Cada resposta é um novo registro; vale a mais recente.
- **Refeições que costuma fazer**: só essas aparecem no dia, além de
  qualquer refeição que já tenha itens naquele dia.
- **Acompanhar água**: sem água, o card some da Dieta e do Dashboard.
- **Restrições**: anotação livre de até 280 caracteres, sem perguntas
  clínicas e sem uso em regras.

### 9.2 Alimentos — `foods`

```text
name
brand            nulo
reference_amount
reference_unit   g | ml | porção
calories_kcal
protein_g
carbohydrate_g
fat_g
fiber_g          nulo
sodium_mg        nulo
source           nulo
```

Nutrientes podem ser cadastrados por 100 g ou por porção. O peso pode
se referir ao alimento pronto/cozido, conforme o cadastro.

O catálogo é **compartilhado entre os perfis da casa** (§6.1): um alimento
cadastrado por um perfil aparece para os outros. Editar um alimento não
muda registros já feitos (§9.4).

### 9.3 Refeições

Tipos iniciais: café da manhã, lanche da manhã, almoço, pré-treino,
jantar, ceia, personalizado.

Exemplo de almoço:

```text
Arroz cozido: 150 g
Feijão cozido: 100 g
Peito de frango grelhado: 180–200 g
Salada/legumes
```

### 9.4 Registros — `food_logs`

Cada registro guarda uma **cópia dos nutrientes calculados** no momento
do registro. Editar um alimento depois não altera dias passados.

```text
log_date        data local
meal_type       breakfast | morning_snack | lunch | pre_workout | dinner | supper | custom
meal_name       só em custom
food_id
food_snapshot   cópia do alimento (nome, marca, unidade, nutrientes de referência)
quantity        na unidade do alimento
calories_kcal, protein_g, carbohydrate_g, fat_g, fiber_g, sodium_mg   para a quantidade
consumed_at     nulo = planejado
sort_order
```

- Mudar a quantidade recalcula a partir de `food_snapshot`, não do
  alimento atual.
- Dias passados aceitam registros; dias futuros só para **planejar**, até
  30 dias à frente. Marcar como consumido só vale para hoje ou dias
  passados.
- O total do dia mostra o **consumido** e o **planejado**.
- Um alimento já registrado não pode ser excluído do catálogo, só editado.

### 9.4.1 Água — `water_logs`

```text
log_date     data local
amount_ml
logged_at    instante
```

Registro rápido no dia (atalhos de copo e garrafa), comparado com a meta
de água (§9.6). A água faz parte da nutrição, não dos hábitos (§11.2).

### 9.5 Recursos

- cadastrar, editar e excluir alimento não utilizado;
- montar refeição;
- salvar refeição favorita (`meal_templates`);
- duplicar refeição;
- "repetir refeição de ontem";
- marcar refeição como consumida;
- alterar quantidade e recalcular macros imediatamente;
- mostrar total diário.

Regras dos atalhos:

- Duplicar e "repetir de ontem" copiam os registros de origem como estão
  (mesma cópia do alimento e mesmos valores) e entram como **planejados**.
- Uma favorita (`meal_templates`, `meal_template_items`) guarda só
  alimentos e quantidades; ao usá-la, os valores vêm do catálogo atual. O
  nome é único por perfil, sem diferenciar maiúsculas.
- Um alimento usado em registros ou em favoritas não pode ser excluído do
  catálogo.

### 9.6 Metas nutricionais — `nutrition_targets`

```text
profile_id
effective_from   data a partir da qual a meta vale
calories_kcal
protein_g
carbohydrate_g   nulo
fat_g            nulo
water_ml         nulo
reason           nulo
source           manual | recommendation
```

A meta vigente em uma data D é a de maior `effective_from` ≤ D. Mudar uma
meta cria um novo registro; nunca altera o anterior.

Cada meta é um **valor único** (sem faixa mínima e máxima). Faixas podem
ser adicionadas depois sem mudar os registros existentes.

- Calorias e proteína são obrigatórias; carboidratos, gorduras e água são
  opcionais. Valores inteiros.
- Um perfil começa **sem metas**: o app nunca preenche nem calcula metas.
  Elas são definidas em Configurações — Nutrição e valem a partir do dia
  em que são salvas.

### 9.7 Metas iniciais do seed

```text
Calorias: 2400 kcal/dia
Proteína: 190 g/dia
Água:     3500 ml/dia
```

Só para o seed de desenvolvimento (§8.9). Editáveis, nunca codificadas na
lógica: no app, cada perfil define as próprias metas (§9.6).

### 9.8 Receitas e marmitas (após a nutrição básica estar estável)

Uma receita (`recipes`, `recipe_items`) contém vários alimentos e o
sistema calcula o total.

Planejamento de marmitas:

```text
Preparar 10 marmitas
Lucas: 5
Perfil 2: 5
```

O sistema soma os ingredientes e pode gerar lista de compras. Módulo
separado, que não bloqueia a V0.2.

### 9.9 Dashboard nutricional

```text
Calorias      1.680 / 2.400 kcal
Proteína       132 / 190 g
Carboidratos   xxx / meta
Gorduras        xx / meta
```

- Em Dieta — Dia: o consumido contra a meta, com barras de progresso, e o
  planejado ao lado. Sem meta, mostra só os totais.
- No Dashboard, o card "Hoje" (calorias, proteína e água) aparece quando o
  perfil tem metas ou registros de nutrição no dia.

---

## 10. V0.3 — Treino

### Questionário do módulo

Ao ativar o módulo: experiência, dias disponíveis por semana, local
(academia, casa) e equipamentos. As regras sugerem planos-modelo; o
usuário decide (§10.6, §21.2).

Na V0.3 (`workouts@1`, em `profile_questionnaires` com código `workouts`;
regras `workout-rules@1`):

- Aparece na primeira abertura de Treinos; todas as respostas são
  opcionais; pode ser pulado e refeito em Configurações — Treino. Cada
  resposta é um novo registro; vale a mais recente.
- Sugestões (nada é importado sem o usuário): **Cutting 2026** com
  academia (ou academia e casa) e 5 ou mais dias por semana; **Core em
  casa** para quem treina em casa, ou como complemento de quem treina na
  academia. Academia com menos de 5 dias: orienta montar o próprio plano.
- Experiência e equipamentos são só registrados por enquanto.

### 10.1 Biblioteca de exercícios — `exercises`

```text
profile_id          nulo = exercício do sistema
name
muscle_group
secondary_muscles
equipment
instructions
notes
load_increment_kg   nulo (incremento sugerido para progressão)
is_active
```

Grupos: peito, costas, ombros, bíceps, tríceps, antebraço, quadríceps,
posteriores, glúteos, panturrilha, abdômen/core, lombar, cardio/outros.

- **Exercícios do sistema** (`profile_id` nulo, com `code` estável): os
  exercícios citados em §10.7–10.9, criados pela migration, com instruções
  curtas e neutras de execução (nunca orientação médica). Somente leitura.
- **Exercícios do perfil**: criados, editados e desativados
  (`is_active = 0`) pelo próprio perfil; o histórico é preservado.
- Nome único entre o catálogo do sistema e os exercícios do perfil, sem
  diferenciar maiúsculas. `secondary_muscles` é uma lista de grupos.

### 10.2 Planos

```text
workout_plans            profile_id, name, status
workout_days             plan_id, name, weekday nulo, sort_order
workout_plan_exercises   workout_day_id, exercise_id, sort_order, prescrição
```

Exemplo de plano "Cutting 2026":

```text
Segunda: PULL + antebraço
Terça:   PUSH
Quarta:  LEGS A
Quinta:  UPPER + antebraço
Sexta:   LEGS B + lombar
```

- Um perfil pode ter **vários planos ativos** ao mesmo tempo (ex.: academia
  e core em casa); planos podem ser arquivados e restaurados. Nome único
  por perfil, sem diferenciar maiúsculas.
- `workout_days.weekday`: 1 (segunda) a 7 (domingo) ou nulo. As três
  tabelas guardam `profile_id` e usam soft delete.
- Os planos de §10.7 e §10.8 podem ser **importados** como cópia editável;
  os exercícios vêm do catálogo do sistema. Um exercício desativado na
  biblioteca continua no plano, sinalizado.

### 10.3 Prescrição

Os exemplos do programa usam faixas e exercícios por tempo, então a
prescrição suporta:

```text
sets
target_type        reps | seconds
min_reps / max_reps         (target_type = reps)
min_seconds / max_seconds   (target_type = seconds)
per_side           bool (ex.: "por lado")
min_rir / max_rir           nulos
min_rest_seconds / max_rest_seconds
notes
```

Exemplo: Supino reto — 3 × 6–8 — RIR 1–2 — descanso 150–180 s.

Valores inteiros: séries 1–20, repetições 1–100, segundos 1–3.600, RIR
0–10, descanso 0–900 s; em cada faixa, mínimo ≤ máximo, e um valor só
vira faixa fixa (ex.: 10–10). Só a faixa do `target_type` é guardada.

### 10.4 Execução

Tela otimizada para uso rápido:

```text
SUPINO RETO

Meta            3 × 6–8 · RIR 1–2
Última sessão   90 kg · 8 / 8 / 7

Série 1   Carga [90]  Reps [8]  RIR [2]  [✓]
Série 2   ...

[Iniciar descanso 02:30]
```

Dados:

```text
workout_sessions        profile_id, workout_day_id nulo, started_at, finished_at, notes
exercise_performances   session_id, exercise_id, plan_exercise_id nulo, sort_order, notes
exercise_sets           performance_id, set_number, weight_kg nulo,
                        repetitions nulo, duration_seconds nulo, rir nulo,
                        completed, notes
```

`exercise_sets` pertence a uma `exercise_performance`, que liga a sessão
ao exercício. Isso permite trocar ou adicionar exercícios durante a
sessão.

Regras (as três tabelas guardam `profile_id` e usam soft delete):

- Uma sessão aberta por perfil. Ela começa por um dia de plano (com as
  séries da prescrição) ou livre; cada série é salva ao sair do campo, e
  uma sessão interrompida é retomada.
- Cada série nasce com a carga da mesma série da última sessão daquele
  exercício; repetições e RIR ficam vazios. A "última sessão" é a sessão
  finalizada mais recente com o exercício.
- Finalizar exige pelo menos uma série concluída. Descartar pede
  confirmação. Valores: carga 0–1.000 kg, repetições 0–1.000, tempo em
  segundos, RIR 0–10.

### 10.5 Histórico por exercício

Última sessão, melhor carga, melhor série, evolução, volume, frequência e
histórico completo.

Só valores registrados, sem estimativas (nada de 1RM calculado): a partir
das sessões finalizadas, **melhor carga** = maior carga de uma série
concluída; **melhor série** = maior carga, desempate por mais repetições;
**volume** da sessão = Σ carga × repetições das séries concluídas;
**frequência** = sessões com o exercício nas últimas 4 semanas.

### 10.6 Progressão de carga

Sempre como **sugestão**, nunca alteração silenciosa. Método inicial:
**progressão dupla**.

Se todas as séries atingirem o limite superior de repetições com RIR
dentro da faixa:

```text
Sugestão: considere aumentar a carga na próxima sessão.
```

O usuário decide. Não existe incremento universal; ele é configurado por
exercício (`load_increment_kg`).

- A regra olha a **última sessão** finalizada com o exercício: as N
  séries prescritas concluídas, cada uma com repetições ≥ máximo (ou tempo
  ≥ máximo) e, se houver RIR prescrito, RIR dentro da faixa.
- O incremento vale **por perfil** (`profile_exercise_settings`), também
  para os exercícios do sistema; sem ele, vale o do exercício. Sem nenhum,
  a sugestão aparece sem o "+X kg".
- A sugestão é só texto no card do exercício: a carga pré-preenchida
  continua a da última sessão.

### 10.7 Programa inicial (seed opcional)

**Segunda — PULL + antebraço**

- Barra fixa/puxada alta — 3×6–10
- Remada com apoio no peito — 3×6–10
- Puxada unilateral — 2×10–12
- Remada baixa — 2×8–12
- Crucifixo inverso — 3×12–20
- Rosca direta — 3×6–10
- Rosca inclinada — 2×10–12
- Rosca inversa — 3×8–12
- Flexão de punho — 2×12–20
- Farmer's Walk — 2×30–45 s

**Terça — PUSH**

- Supino reto — 3×6–8 — RIR 1–2
- Supino inclinado com halteres — 3×8–10
- Crossover — 2×10–15
- Elevação lateral — 4×10–15
- Tríceps corda — 3×8–12
- Extensão de tríceps acima da cabeça — 2×10–15

**Quarta — LEGS A**

- Aquecimento em bike — 5–8 min
- Smith Squat ou Hack Squat — 3×6–10
- Leg Press 45° — 3×10–12
- Cadeira extensora — 2×12–15
- Flexora — 3×8–12
- Panturrilha — 4×8–15

Trabalho de core pode ser feito separadamente em casa.

**Quinta — UPPER + antebraço**

- Supino inclinado em máquina/Smith — 3×6–10
- Puxada neutra — 3×8–10
- Remada com apoio — 3×8–10
- Desenvolvimento em máquina — 2×8–10
- Elevação lateral na polia — 3×12–20
- Rosca na polia — 2×10–15
- Tríceps na polia — 2×10–15
- Rosca martelo — 3×8–12
- Extensão de punho — 2×12–20
- Dead Hang — 2×30–60 s

**Sexta — LEGS B + lombar**

- Flexora — 3×8–12
- Romanian Deadlift/Stiff — 3×6–10, quando tolerado sem dor
- Leg Press — 3×10–15
- Afundo/passada ou alternativa — 2×8–12
- Panturrilha — 4×10–15
- Hiperextensão 45° — progressão conservadora
- Prancha lateral — 2 séries

Exercícios que provocam dor articular/lombar devem poder ser substituídos.

### 10.8 Treino doméstico de abdômen/core

Programa inicial 3× por semana, tratado como qualquer outro plano, sem
código especial:

```text
Abdominal reverso   3 × 12–20
Crunch controlado   3 × 15–20
Dead Bug            3 × 8–12 por lado
Prancha lateral     2 × 30–45 s por lado
Bird Dog            2 × 10–12 por lado
Prancha frontal     2 × 30–60 s
```

### 10.9 Lombar

O produto deve permitir registrar progressão conservadora (Bird Dog,
Dead Bug, prancha, prancha lateral, hiperextensão 45°, RDL/Stiff quando
apropriado).

O aplicativo não interpreta dor como necessidade de aumento de carga.
Futuramente, `exercise_performances` terá campos opcionais
`pain_before`, `pain_during` e `pain_after` (escala 0–10), apenas como
registro pessoal, sem diagnóstico.

---

## 11. V0.4 — Cardio e hábitos

### 11.1 Cardio — `cardio_sessions`

```text
profile_id
activity_type        caminhada | bicicleta | corrida | elíptico | personalizado
started_at
duration_minutes
distance_km          nulo
steps                nulo
intensity            nulo
heart_rate_average   nulo
notes
```

Exemplo inicial: caminhada de 40–45 min, 5–6× por semana. Bike doméstica
também é suportada.

Os passos de uma sessão são só um dado dela; o total de passos do dia é o
hábito "Passos" (§11.2). Os dois nunca são somados.

- Também guarda `session_date` (data local) com `started_at` (instante),
  como as pesagens; `activity_name` só em "personalizado". Soft delete.
- Duração inteira de 1 a 600 min; distância 0–300 km; passos até 100.000;
  FC média 30–250 bpm; intensidade leve, moderada ou intensa; nunca em
  data futura.
- Semana de segunda a domingo: o resumo mostra sessões, minutos e km, no
  total e por atividade.
- **Meta semanal** (`cardio_targets`, só histórico, como §9.6): sessões
  por semana (1–14) e/ou minutos por semana (1–3000), digitadas pelo
  usuário e nunca calculadas. Vale a partir do dia em que é salva; os
  dois vazios removem a meta. O card "Esta semana" mostra o progresso.
- **Painel inicial:** card "Hábitos de hoje" (cumpridos / total, com os
  nomes) e card "Cardio da semana" (sessões e minutos contra a meta).
  Cada card só aparece para o perfil que já usa o módulo.

### 11.2 Hábitos

Sistema genérico; nunca uma coluna por hábito.

```text
habit_definitions   profile_id, name, type, unit nulo, target_value nulo, is_active
habit_logs          habit_definition_id, profile_id, log_date, value, notes
```

Tipos: booleano, quantidade, duração, horário.

Exemplos: creatina, passos, caminhada, treino, cardio, horário de sono.
A água é registrada na nutrição (§9.4.1).

- `habit_definitions` também guarda `sort_order`; `habit_logs` tem soft
  delete. Ambos com `profile_id`.
- Valores numéricos por tipo: sim/não = 1/0; quantidade na unidade do
  hábito; duração em minutos (0–1.440); horário em minutos desde a
  meia-noite. Unidade só em quantidade; meta (opcional) só em quantidade e
  duração.
- **Um registro por hábito por dia**: registrar de novo substitui o valor;
  limpar remove o registro. Nunca em data futura.
- **Dia cumprido**: sim/não marcado; quantidade ou duração ≥ meta (ou > 0
  sem meta); horário registrado. A tela mostra os últimos 7 dias.
- Nome único entre os hábitos ativos do perfil. Desativar mantém os
  registros. "Adicionar exemplos" cria Creatina e Passos (meta 8.000);
  caminhada, treino, cardio e sono já têm módulos próprios.

---

## 12. V0.5 — Sono

### 12.1 `sleep_logs`

```text
profile_id
sleep_date          data em que a pessoa acorda (§7.7)
bed_time
sleep_time          nulo
wake_time
duration_minutes    derivado (§7.7)
quality             nulo
notes
```

Interface simples:

```text
Dormiu:   23:48
Acordou:  07:42
Total:    7h54
```

- Horários guardados como instantes UTC; `sleep_time` é opcional. Na tela,
  "Deitou" ou "Dormiu" no horário de acordar ou depois dele conta como da
  véspera (ex.: deitou 23:30, acordou 07:00).
- Ordem deitou ≤ dormiu < acordou; no máximo 20 h entre deitar e acordar;
  nada no futuro. Qualidade opcional de 1 (péssima) a 5 (ótima). Soft
  delete.
- Uma noite por dia (`sleep_date`), garantida por índice único entre os
  registros ativos; ao repetir o dia, a tela oferece editar a noite
  existente. Cochilos ficam para depois.
- O hábito "Horário de dormir" saiu dos exemplos de hábitos (§11.2), pois o
  módulo de sono cobre o horário.

### 12.2 Indicadores

Média de 7 dias, média de 30 dias, consistência, horário médio de dormir
e horário médio de acordar.

- Janelas contadas pela `sleep_date`, terminando hoje; cada média mostra
  em quantas noites se baseia e fica vazia sem noites.
- Horário médio de dormir usa `sleep_time` (ou `bed_time`); horários
  médios são médias circulares (23:30 e 00:30 → 00:00), na hora local do
  dispositivo.
- **Consistência:** variação média, em minutos, dos horários de dormir e
  de acordar nos últimos 30 dias ("±25 min"); exige 2 noites. É um número
  exato, sem interpretação médica.
- O painel inicial mostra um card **Sono** (última noite e média de 7
  dias) só para quem registra sono.

Futuramente pode correlacionar sono e performance, sem atribuir
causalidade médica.

---

## 13. V0.6 — Estatísticas e dashboard completo

### 13.1 Dashboard

Deve responder rapidamente:

1. Onde estou?
2. O que preciso fazer hoje?
3. Estou evoluindo?
4. Estou cumprindo o plano?

```text
SHAPE DE PRAIA
Dia 18 de 63

Tendência  90,1 kg   −1,9 kg desde o início
Cintura    93,4 cm   −2,6 cm

HOJE
Calorias   1.680 / 2.400
Proteína     132 / 190 g
Água         2,1 / 3,5 L
Passos     6.420 / 8.000
Sono       7h12 / 8h
Treino     18:00 — PULL

[ COMEÇAR TREINO ]
```

- O card **Hoje** (0.6.0-alpha.1) reúne calorias, proteína e água; hábitos
  de quantidade com meta (ex.: passos); o sono da noite que terminou hoje
  contra a meta; e o treino do dia. Cada linha só aparece para quem usa o
  módulo.
- **Meta de sono** (`sleep_targets`): minutos por noite, de 1 h a 16 h,
  digitada pela pessoa na tela de Sono; histórico com vigência a partir de
  hoje, como as metas nutricionais (§9.6); em branco remove. O app nunca sugere
  o valor.
- **Treino do dia:** os dias dos planos ativos marcados com o dia da semana
  de hoje, com **Começar treino**; com um treino aberto, **Continuar
  treino**. Sem horário: os planos não guardam hora.

### 13.2 Estatísticas

Gráficos separados para peso do dia, média móvel, média semanal,
velocidade de mudança (kg/semana), cintura, outras medidas, calorias,
proteína, sono, cardio, passos, cargas, volume de treino e frequência.

Não sobrecarregar o dashboard com todos os gráficos.

- Tela **Estatísticas** no menu (0.6.0-alpha.2), com um período para todos
  os gráficos: 30 dias, 90 dias, projeto atual (padrão quando há projeto)
  ou tudo. Cada gráfico só aparece para quem tem registros no módulo.
- **Peso:** peso do dia e média móvel de 7 dias (§7.2); média de cada
  semana ISO (segunda a domingo); velocidade = diferença entre as médias de
  semanas seguidas, dividida pelo número de semanas entre elas (kg/semana).
- **Medidas:** uma medida por vez, cintura por padrão.
- **Calorias e proteína:** só alimentos marcados como consumidos, por dia,
  com a meta vigente em cada dia.
- **Sono:** duração de cada noite e a meta atual.
- **Treino:** volume por semana (carga × repetições das séries concluídas
  com carga), frequência por semana (treinos finalizados) e maior carga de
  cada treino por exercício, abrindo no exercício com mais treinos.
  Exercícios só de tempo não têm carga e ficam de fora.
- **Cardio:** minutos por semana e a meta atual.
- **Passos:** total do dia no hábito de quantidade com unidade "passos" e a
  meta do hábito. Passos de sessões de cardio não entram (§11.1).
- Nos gráficos semanais somados, semanas sem registro contam como zero.

### 13.3 Análise de evolução

Depois de dados suficientes, gerar resumos objetivos por funções
testáveis:

```text
Últimos 14 dias
Peso médio:      −0,62 kg/semana
Cintura:         −1,2 cm
Treinos:         9/10 concluídos
Proteína média:  188 g/dia
Sono médio:      7h31
Performance:     estável
```

Sem aconselhamento médico automático.

- Card **Últimos 14 dias** no painel (0.6.0-alpha.4), calculado por
  `evolutionSummary` no domínio. A janela são os 14 dias que terminam hoje;
  cada linha só aparece com dados suficientes:
  - **Peso médio:** média dos últimos 7 dias menos a dos 7 anteriores
    (kg/semana), com ao menos 3 pesagens em cada semana. Cor pela direção
    do objetivo (§7.6).
  - **Cintura:** última medida da janela menos a última de antes dela (ou a
    primeira da janela); precisa de duas medidas.
  - **Treinos:** finalizados na janela sobre os dias previstos dos planos
    ativos (cada dia da semana marcado conta duas vezes); sem dias marcados,
    só o total.
  - **Proteína média** (dias com alimento consumido) e **sono médio** (noites
    registradas).
  - **Performance:** volume de treino da janela contra os 14 dias anteriores;
    até ±5% é "estável", acima "subindo", abaixo "caindo". Precisa de volume
    nos dois períodos.
- No card **Hoje**, um dia planejado já finalizado hoje aparece como
  "Concluído"; um treino livre finalizado hoje, como "Treino concluído hoje".

---

## 14. V0.7 — Backup, restauração e exportação

### 14.1 Backup completo

```text
evully-backup-YYYY-MM-DD-HHMM.zip
  evully.db
  manifest.json
  photos/
  attachments/
```

### 14.2 Restauração

1. Selecionar backup.
2. Validar versão (`schema_version` não pode ser maior que a do app).
3. Validar integridade (`sha256` e `PRAGMA integrity_check`).
4. Avisar que os dados atuais serão substituídos.
5. Criar backup automático do estado atual.
6. Restaurar.
7. Confirmar sucesso.

Implementação (0.7.0-alpha.1):

- **Escolha:** os backups do Evully da pasta padrão e da pasta adicional,
  do mais novo para o mais antigo, ou um arquivo escolhido no diálogo do
  Windows. A tela nunca envia caminhos: só pasta e nome de um arquivo
  listado.
- **Validação:** o zip precisa conter exatamente `evully.db` e
  `manifest.json` (nenhuma outra entrada, logo nenhum caminho absoluto ou
  com `..`); o `sha256` do banco confere com o manifesto; `PRAGMA
  integrity_check` passa; a última migration do banco não é mais nova que a
  do app (`backup.restore_invalid`, `backup.restore_corrupt`,
  `backup.restore_newer`).
- **Resumo:** nome do arquivo, data, versão do app que o criou e nomes dos
  perfis do backup, com o aviso de que os dados de **todos os perfis** serão
  substituídos. Os nomes só aparecem na tela, nunca no log.
- **Confirmação** ("Substituir e reiniciar"): backup do estado atual
  (`kind = pre-restore`, nunca removido pela limpeza automática); o banco
  validado fica em `restore-pending.db` no diretório de dados e o app
  reinicia. Na abertura, antes de abrir o banco, o arquivo substitui o
  `evully.db` (os `-wal`/`-shm` antigos são removidos); um backup de versão
  anterior passa pelas migrations normais, com o backup pré-migração.

### 14.3 Exportação

Em Configurações › Perfil › **Exportar dados**, sempre do **perfil atual**
(os outros perfis não entram). O diálogo do sistema escolhe onde salvar e
pergunta antes de substituir um arquivo.

- **JSON completo** (`evully-dados-<perfil>-YYYY-MM-DD.json`): `format:
  "evully-profile-export"`, `formatVersion`, versão do app, última migration,
  data da exportação, o perfil e, em `data`, as linhas de cada tabela do
  perfil, mais os alimentos, exercícios do sistema e tipos de medida que o
  perfil usa. Registros excluídos e filhos de registros excluídos ficam de
  fora; um registro excluído que um registro mantido ainda referencia (o dia
  de plano de um treino antigo, a etiqueta de uma pesagem) entra, com
  `deleted_at`, para o arquivo ficar consistente na transferência (§14.4).
- **CSV por categoria** num zip (`evully-csv-<perfil>-YYYY-MM-DD.zip`), no
  formato do Excel brasileiro dos modelos de importação (§8.8): `;`, vírgula
  decimal, `dd/mm/aaaa`, horas locais `HH:mm`, UTF-8 com BOM. Arquivos:
  `weights.csv`, `measurements.csv` (mesmas colunas da importação: podem ser
  importados de volta), `workouts.csv` (treinos finalizados, com volume),
  `exercise_sets.csv`, `nutrition.csv`, `water.csv`, `sleep.csv`,
  `cardio.csv` e `habits.csv`. Texto que começa com `=`, `+`, `-` ou `@`
  recebe um `'` na frente, para o Excel não executar como fórmula.

### 14.4 Transferência de perfil entre computadores

Para quem usa computadores diferentes (§2.5):

1. No computador de origem: "Exportar perfil" gera
   `evully-perfil-<nome>-YYYY-MM-DD.zip` com todos os dados de um único
   perfil e um manifesto.
2. No computador de destino: "Importar perfil" valida versão e
   integridade e mostra um resumo.
3. Se o perfil (mesmo UUID) não existe, ele é criado. Se já existe, o
   usuário escolhe **substituir** (com backup automático antes) ou
   **cancelar**. Mesclagem registro a registro fica para a sincronização
   da Fase 2.

Implementação (V0.7):

- "Exportar perfil" e "Importar perfil" ficam em Configurações › Perfil ›
  **Transferir perfil**. "Importar perfil" também aparece na seleção de
  perfis e, num computador ainda sem perfis, abaixo de "Vamos criar seu
  perfil".
- O zip contém só `profile.json` (o JSON completo da §14.3) e
  `manifest.json` (`format: "evully-profile-transfer"`, `formatVersion`,
  versão do app, última migration, data, id e nome do perfil e o `sha256`
  do `profile.json`). Só esse zip é aceito na importação.
- Antes de gravar, o Evully recusa:
  - zip com outras entradas;
  - `sha256` diferente;
  - formato ou migration mais novos que os do app;
  - tabela ou coluna que o banco não tem;
  - linha de outro perfil;
  - registro filho sem o pai no arquivo.

  Arquivos de versões anteriores são aceitos. Se o banco recusar algum
  dado, nada é gravado.
- O resumo mostra nome, data, versão, contagens por módulo e se o perfil já
  existe (em uso ou arquivado). Ao substituir, o Evully cria um backup
  `pre-import` (nunca removido pela limpeza automática), apaga o perfil e
  grava o do arquivo numa única transação. Alimentos, exercícios do sistema
  e tipos de medida são gravados só se faltarem. Os outros perfis não são
  tocados. Depois, o app volta para a seleção de perfis.

---

## 15. V0.8 a V1.0 — Polimento e distribuição Windows

Objetivo: `Evully-Setup.exe`.

- instalador e atalhos;
- atualização automática pelo próprio app, com assinatura própria (§33);
- diretório de dados separado do executável (§5.4);
- desinstalação não apaga dados pessoais sem confirmação explícita;
- logs locais de erro;
- versão exibida no aplicativo.

O instalador não terá assinatura digital na Fase 1, então o Windows
SmartScreen exibirá um aviso na instalação. Isso é aceitável para uso
doméstico.

---

## 16. UX/UI

A identidade visual, os tokens, os componentes e as regras entre
plataformas estão em [DESIGN.md](DESIGN.md).

### 16.1 Diretrizes

- limpa, moderna e rápida;
- desktop-first na Fase 1, já considerando responsividade para a web;
- evitar excesso de informação;
- modo claro/escuro;
- acessibilidade básica (contraste, foco visível, navegação por teclado,
  cor nunca como única informação);
- interface em **português do Brasil**; números e datas formatados com
  `Intl` em `pt-BR` (ex.: `89,8 kg`, `06/12/2026`). Código, banco e
  identificadores ficam em inglês;
- tom neutro e encorajador: sem vermelho para resultados, sem mensagens
  de culpa e sem linguagem alarmista;
- a tela de seleção de perfil nunca exibe dados pessoais (§8.1).

### 16.2 Navegação

Cada item do menu lateral só aparece a partir da versão indicada:

| Item | Versão |
|---|---|
| Dashboard | V0.1 |
| Corpo (Peso, Medidas) | V0.1 |
| Configurações | V0.1 |
| Dieta | V0.2 |
| Treinos | V0.3 |
| Cardio | V0.4 |
| Hábitos | V0.4 |
| Sono | V0.5 |
| Hoje | V0.6 |
| Estatísticas | V0.6 |
| Lembretes | V1.3 |
| Saúde / Exames | V1.4 |
| Evully Coach | V1.5 |

No topo: `Perfil atual: Lucas ▼`.

---

## 17. Modelo de dados conceitual

| Grupo | Tabelas | Versão |
|---|---|---|
| Perfis | `profiles`, `projects`, `settings` | V0.1 |
| Acompanhamento | `profile_questionnaires`, `tracking_configs`, `profile_measurement_types` | V0.1 |
| Acompanhamento | `tracking_templates` (modelos para profissionais) | V3.x |
| Corpo | `body_weights`, `tags`, `body_weight_tags`, `measurement_types`, `body_measurements`, `body_measurement_values` | V0.1 |
| Corpo | `progress_photos`, `body_targets`, `body_composition_records`, `cycle_logs` | futuro |
| Nutrição | `nutrition_targets`, `foods`, `meal_templates`, `meal_template_items`, `food_logs`, `water_logs` | V0.2 |
| Nutrição | `recipes`, `recipe_items` | V0.2+ |
| Treino | `exercises`, `workout_plans`, `workout_days`, `workout_plan_exercises`, `workout_sessions`, `exercise_performances`, `exercise_sets` | V0.3 |
| Cardio | `cardio_sessions`, `cardio_targets` | V0.4 |
| Hábitos | `habit_definitions`, `habit_logs` | V0.4 |
| Sono | `sleep_logs` | V0.5 |
| Inteligência | `analytics_snapshots`, `recommendation_events`, `recommendation_decisions` | V1.1–V1.2 |
| Lembretes | `notification_preferences`, `notification_events` | V1.3 |
| Saúde | `health_exams`, `health_exam_results`, `health_reference_ranges`, `health_documents` | V1.4 |
| IA | `ai_conversations`, `ai_messages`, `ai_usage_logs` | V1.5 |
| Contato | `contact_channels`, `consent_records` | V2.x |
| Controle | tabela de controle de migrations (gerenciada pelo Kysely) | V0.1 |

### 17.1 Fotos de progresso (futuro)

`progress_photos`: `profile_id`, `taken_on`, `pose` (frente, lado,
costas), `file_path`, `notes`. Os arquivos ficam no diretório de dados do
app; o banco guarda apenas metadados e caminho relativo.

Decidido em 09/11/2026: ao importar, cada foto é reduzida (lado maior até
2048 px, JPEG com qualidade em torno de 80) e perde os metadados EXIF,
inclusive a localização GPS; o app guarda só a cópia reduzida, e o backup
passa a incluir `photos/` (§14.1). A redução usa o `nativeImage` do
Electron, sem dependência nova.

---

## 18. Testes

### 18.1 Regras de negócio (unitários)

- dias do projeto;
- peso do dia, peso inicial, diferença;
- média móvel de 7 dias;
- regras do questionário (respostas → configuração), por versão de regra;
- exibição condicional de perguntas (ex.: ciclo conforme o sexo informado);
- direção dos indicadores por objetivo;
- configuração vigente em uma data;
- leitura e validação de CSV (formatos de data, decimal e separador);
- retenção de backups automáticos (só remove `kind = automatic`);
- cálculo de macros e soma de refeições;
- duração do sono;
- progressão dupla;
- cálculo de volume.

### 18.2 Persistência (integração, SQLite real em memória ou temporário)

- migrations do zero até a última;
- isolamento entre perfis em todos os repositórios;
- soft delete, arquivamento e exclusão definitiva de perfil;
- histórico de configurações (inserção apenas);
- backup e restauração (validação, backup `pre-restore` e troca na abertura);
- exportação e transferência de perfil (isolamento, ida e volta entre dois bancos, substituição com backup `pre-import`, arquivos recusados).

### 18.3 Fluxos críticos (interface)

Automatizados com Playwright no app real:

```text
V0.1   criar perfil → responder ao questionário → aceitar a proposta
V0.1   registrar peso → registrar medidas → importar CSV
V0.1   trocar de perfil → confirmar isolamento dos dados
V0.1   fechar o app → abrir novamente → confirmar persistência e backup automático
V0.2   registrar refeição
V0.3   iniciar treino → salvar série → finalizar treino
```

---

## 19. Critérios de aceite da Fase Desktop

Ao final da V1.0 o usuário deve conseguir: criar perfis; configurar o
acompanhamento pelo questionário; criar projetos;
registrar peso e medidas; acompanhar gráficos; cadastrar alimentos;
montar e registrar refeições; acompanhar macros; criar planos de treino;
executar treinos registrando séries, cargas, repetições e RIR; consultar
histórico; receber sugestões simples de progressão; registrar cardio,
hábitos e sono; visualizar estatísticas; fazer backup; restaurar;
exportar dados; instalar o aplicativo no Windows.

---

## 20. Evully Intelligence

A inteligência é dividida em camadas. A IA generativa NÃO é responsável
por cálculos que podem ser determinísticos.

```text
Dados do usuário
      ↓
Analytics Engine
      ↓
Recommendation Engine
      ↓
Evully Coach AI
      ↓
Explicação / proposta
      ↓
Usuário aprova ou rejeita
```

### 20.1 Analytics Engine (V1.1)

Cálculos testáveis, reproduzíveis e independentes de IA:

- médias e tendências de peso; janelas de 7, 15, 30 e 60 dias;
- velocidade semanal de ganho/perda;
- evolução de circunferências;
- percentual de gordura estimado, quando houver método suportado;
- volume, frequência, progressão, PRs e volume por grupo muscular;
- aderência ao treino e à dieta;
- ingestão calórica e de macronutrientes;
- estimativas de TMB e gasto energético;
- sono, cardio, passos e hábitos;
- tendências de exames laboratoriais estruturados.

Todo cálculo registra versão/método quando necessário e possui testes.

### 20.2 Recommendation Engine (V1.2)

Camada determinística que transforma métricas em sinais, por exemplo:

- possível estagnação de peso;
- perda/ganho mais rápido que a faixa configurada;
- queda persistente de performance;
- baixa aderência;
- exercício atingiu critério de progressão dupla;
- volume muito diferente do alvo;
- registro ausente;
- exame fora do intervalo de referência informado pelo laboratório.

Cada recomendação armazena os dados que a originaram, regra/versão,
data, status e decisão do usuário.

Recomendações também podem sugerir mudanças na configuração de
acompanhamento (ex.: "sua cintura está estável há 3 semanas; quer
acompanhar também o quadril?"). Se aceitas, geram um novo registro em
`tracking_configs`.

---

## 21. Evully Coach AI

Camada conversacional e interpretativa (V1.5). Usa dados estruturados do
Evully para explicar evolução, responder perguntas, propor treino/dieta e
resumir períodos.

### 21.1 Capacidades planejadas

- propor treino a partir de objetivo, experiência, disponibilidade,
  equipamentos, preferências e limitações;
- analisar e comparar períodos de 7, 15, 30 e 60 dias;
- explicar progressão ou regressão por exercício;
- analisar distribuição de volume e frequência;
- resumir dieta, macros e aderência;
- explicar tendências de peso e medidas;
- ajudar a revisar metas;
- responder perguntas sobre o histórico do perfil;
- gerar resumo semanal/mensal.

### 21.2 Regra fundamental

> A IA propõe; o usuário decide.

Nunca alterar silenciosamente calorias, macros, metas, programa de
treino, exercícios, volume, frequência, suplementação ou qualquer dado de
saúde. Toda proposta aplicável tem `Aceitar`, `Editar` e `Rejeitar` e,
quando aceita, gera histórico.

### 21.3 Contexto e provedores

- Enviar apenas o necessário, como JSON e resumos calculados localmente,
  montados por um `AIContextBuilder` que aplica minimização.
- Integração abstrata (`AIProvider` → `OpenAIProvider`, `LocalProvider`
  futuro). O domínio não depende de nenhum SDK.
- Modos: IA desativada (padrão), OpenAI API pessoal, Evully Cloud
  (futuro).
- A chave de API nunca é salva em texto puro no SQLite, logs, repositório
  ou arquivos de configuração; usar o armazenamento seguro do sistema
  operacional (`safeStorage` do Electron).
- A assinatura pessoal do ChatGPT não é requisito. A integração comercial
  passará pelo backend do Evully.

### 21.4 Auditoria e custos

Registrar, sem conteúdo sensível desnecessário: provedor/modelo, data,
finalidade, tokens quando fornecidos, custo estimado, versão do prompt e
decisão do usuário quando relevante.

---

## 22. Evully Nutrition Intelligence

Cálculos nutricionais são determinísticos: TMB por métodos suportados,
gasto energético estimado, meta calórica, macros, fibras e
micronutrientes quando houver dados, média de ingestão, aderência e
tendência de peso versus ingestão.

Com histórico suficiente, o sistema pode estimar a resposta energética
individual, sempre indicando que é estimativa.

Mudanças de meta criam histórico:

```text
2400 kcal → 2300 kcal
Data · Motivo · Dados utilizados · Origem da sugestão · Aprovado por
```

---

## 23. Composição corporal e percentual de gordura

Métodos: entrada manual, adipômetro, bioimpedância, DEXA, fórmulas por
circunferência suportadas e outros futuros.

Sempre armazenar `value`, `method`, `measured_at`, `source` (nulo) e
`notes`.

Valores calculados são exibidos como **estimativas**, com método e
limitações. Comparações de tendência devem usar o mesmo método.

---

## 24. Evully Health — exames laboratoriais

Módulo separado (V1.4), com proteção reforçada.

### 24.1 Entrada

Lançamento manual; importação de PDF; OCR apenas quando necessário;
integrações autorizadas no futuro. Um PDF importado nunca é considerado
interpretado corretamente sem validação do usuário quando houver dúvida.

### 24.2 Estrutura

```text
health_exams
  profile_id, collected_at, laboratory, document_id nulo, notes

health_exam_results
  exam_id, analyte_code nulo, analyte_name, value, unit,
  reference_min nulo, reference_max nulo, reference_text nulo,
  flag nulo, method nulo
```

Preservar o intervalo de referência do laboratório em vez de aplicar um
intervalo global.

### 24.3 Análises

Histórico por marcador, comparação de exames, sinalização de resultados
fora da referência informada, tendências, explicação informativa do que
um marcador representa, perguntas para levar ao profissional e relações
temporais apresentadas como hipóteses, sem causalidade clínica.

### 24.4 Vitaminas e suplementos

1. **Suplementação esportiva/nutricional geral** — informações baseadas
   em evidência, utilidade e contexto.
2. **Correção de possível deficiência** — nunca vira prescrição
   automática de dose ou tratamento.

O sistema pode indicar que um marcador merece atenção e orientar
avaliação profissional. Não diagnostica nem prescreve.

Níveis de sinalização: **Informativo**, **Atenção**, **Avaliação
profissional recomendada**. Sem linguagem alarmista.

---

## 25. Evully Reminders

Sistema unificado de lembretes (V1.3 local; demais canais na Fase 2).

Canais: notificações do Windows; push web/mobile, e-mail e WhatsApp no
futuro.

Tipos: pesagem, medidas, treino, refeição, proteína/macros, hidratação,
hábitos, sono, resumo semanal, registros pendentes.

O sistema evita mensagens redundantes (treino concluído não gera
lembrete de treino) e não inventa estado quando faltam dados.

Preferências por perfil: `channel`, `event_type`, `enabled`,
`preferred_time`, `quiet_hours_start`, `quiet_hours_end`, `timezone`.

---

## 26. WhatsApp

Apenas após existir backend confiável, usando a integração oficial do
WhatsApp Business. Nunca automação de WhatsApp Web.

Requisitos: opt-in registrável; número verificado; preferências por
categoria; horário silencioso; cancelamento fácil; templates quando
exigidos; logs de entrega sem conteúdo sensível; rate limiting; nunca
enviar exames ou dados sensíveis sem consentimento explícito.

---

## 27. Privacidade, consentimento e dados sensíveis

Dados de saúde, exames, medidas, fotos, dieta, treino, respostas de
questionários e dados de ciclo menstrual podem ser sensíveis. O produto comercial segue privacy by design e a LGPD.

Princípios: minimização; finalidade clara; consentimento quando
aplicável (separado para IA); exportação e exclusão; criptografia em
trânsito; proteção em repouso; controle de acesso; auditoria; segregação
entre perfis/contas; retenção configurada; segredos fora do cliente;
nada sensível em logs/telemetria; informar quando dados forem enviados a
um provedor externo.

Antes da disponibilização comercial: política de privacidade, exclusão de
conta, retenção, proteção de fotos, logs de segurança e resposta a
incidentes.

A Fase 1 não implementa essa infraestrutura, mas não toma decisões que a
impeçam.

---

## 28. Histórico e rastreabilidade

Preferir histórico a sobrescrita para tudo que afeta análises:
configurações de acompanhamento, metas nutricionais e corporais, programas de treino, recomendações e decisões,
métodos de BF, preferências de notificação, consentimentos e resultados
laboratoriais corrigidos.

A análise de uma data passada usa a meta vigente naquela data.

---

## 29. Fase 2 — Aplicação Web

Somente após validação do desktop.

### 29.1 Plataformas

```text
App web    React + Vite + Tailwind + shadcn/ui, PWA (apps/web), com as
           telas de packages/app-web
Site       Next.js (apps/site): apresentação, planos, download do
           desktop, ajuda, termos e privacidade
Celular    o próprio PWA, instalável pelo navegador
Backend    API NestJS + PostgreSQL (apps/api)
```

O PWA resolve cedo o registro pelo celular (§33.2), sem lojas de
aplicativos. O planejamento completo do site, do app web e dos apps
Android/iOS está em [FRONTEND.md](FRONTEND.md).

Entram: autenticação, contas, acesso pelo celular, backend/API,
sincronização, armazenamento remoto, segurança web e importação do
histórico desktop ("Exportar conta" no desktop → "Importar dados do
Evully Desktop" na web), incluindo perfis, pesos, medidas, alimentos,
refeições, treinos, séries, cardio, hábitos e sono.

### 29.2 Backend

API em **NestJS** (Fastify) + **PostgreSQL** + **Kysely** + **zod**,
organizada como monólito modular, sem estado, hospedada na região São
Paulo. Regras de negócio em `packages/domain`, compartilhadas com o
desktop, a web e o celular.

O planejamento completo está em [BACKEND.md](BACKEND.md): módulos,
modelo Conta → Família → Perfis e autorização, convenções da API,
autenticação, **protocolo de sincronização** com desktop e celular,
dados, arquivos, filas, observabilidade, ambientes, testes e LGPD.

```text
App web (PWA)     ─┐
App mobile (RN)   ├── HTTPS ──▶ API NestJS ──▶ PostgreSQL
Desktop (sync)    ─┘                  └──────▶ Storage S3 · Fila pg-boss
```

---

## 30. Fase 3 — SaaS comercial

Somente depois de validação por uso real. Nenhuma destas
funcionalidades deve complicar a Fase 1.

### 30.0 Aplicativos para lojas

Apps nativos para Play Store e App Store em **React Native com Expo**
(`apps/mobile`), com telas próprias sobre a mesma lógica compartilhada
(`packages/app-core`), banco local com sincronização, notificações,
câmera, biometria, Apple Health e Health Connect. Compilação de iOS na
nuvem (EAS Build), sem Mac. Detalhes em [FRONTEND.md](FRONTEND.md), §6.

### 30.1 Recursos candidatos

Cobrança recorrente, recuperação de senha, login Google/Apple, PWA,
apps Android/iOS, notificações, lista de compras compartilhada,
planejamento familiar, personal trainer, nutricionista, relatórios,
painel administrativo, analytics e limites por plano.

### 30.2 Couple / Family

Duas ou mais pessoas podem pertencer a um grupo. Cada usuário mantém
dados privados e pode compartilhar seletivamente metas, treinos,
refeições, lista de compras, aderência e sequência. Peso, fotos e
medidas são privados por padrão.

### 30.3 Planos comerciais (planejamento, não implementar)

| Plano | Conteúdo |
|---|---|
| Free | Registro corporal, treino/dieta básicos, cálculos essenciais, histórico conforme estratégia. |
| Pro | Histórico completo, Analytics avançado, Evully Coach AI, análises 7/15/30/60 dias, relatórios, recomendações. |
| Couple / Family | Múltiplos membros, refeições/marmitas/lista de compras compartilhadas, privacidade individual por padrão. |
| Coach / Professional | Gestão autorizada de clientes, prescrição, relatórios, permissões granulares, auditoria. |

Evully Health pode ter disponibilidade/termos próprios conforme
requisitos legais de cada mercado.

### 30.4 Módulos

Evully Desktop, Web, Mobile, Analytics, Coach, Health, Reminders,
Couple/Family, Pro e Cloud representam posicionamento, não microsserviços
separados.

### 30.5 Evully para profissionais

Na Fase 1 cada usuário configura o próprio acompanhamento (§8.2). Em uma
fase comercial futura, o Evully pode ser oferecido a profissionais
(personal trainers, nutricionistas) para uso com seus clientes:

- o profissional cria **modelos de acompanhamento**
  (`tracking_templates`), por exemplo "Recomposição — iniciante", usando
  o **mesmo formato JSON** de `tracking_configs`;
- com autorização do cliente, aplica um modelo ao perfil dele; a
  configuração resultante é registrada com `source = professional` e
  passa pelo mesmo fluxo de proposta → aceite;
- o profissional acompanha a evolução dos clientes com permissões
  granulares, trilha de auditoria e sem acesso a dados que o cliente não
  compartilhou (ex.: ciclo menstrual, exames);
- o cliente pode revogar o acesso a qualquer momento.

Requisitos que isso impõe desde já, e que a V0.1 cumpre: configuração
como dado e não código, histórico de configurações, campo `source` e
regras versionadas.

### 30.6 Planos, assinaturas e pagamentos

Preparação para faturar com assinaturas, sem implementar antes da hora:

- **Entitlements desacoplados**: uma camada responde "o plano desta conta
  permite X?" (ex.: guard `@RequiresEntitlement('advanced_analytics')`).
  Telas e regras consultam entitlements, nunca o nome do plano. Criar ou
  mudar planos não exige alterar código de funcionalidades.
- **Pagamentos no Brasil**: Pix e cartão recorrente por um provedor como
  Stripe, Asaas ou Mercado Pago, integrado por webhooks idempotentes no
  módulo `billing`.
- **Lojas de aplicativos**: assinaturas compradas dentro dos apps seguem
  as regras da Apple e do Google. Um serviço como **RevenueCat** unifica
  assinaturas da web, App Store e Play Store em um único status por
  conta.
- **Métricas de negócio**: retenção, conversão Free → Pro e cancelamentos,
  sem dados de saúde nos eventos.
- **Multi-tenancy e LGPD** (§27; [BACKEND.md](BACKEND.md), §4 e §14) são pré-requisitos para vender.

---

## 31. O que NÃO fazer

A IA de desenvolvimento NÃO deve:

- transformar o projeto em SaaS antes do tempo;
- adicionar autenticação online, pagamentos ou dependência de cloud;
- hardcodar dados do Lucas na lógica;
- misturar UI e persistência;
- armazenar dados em localStorage;
- criar banco específico por pessoa;
- sobrescrever backups sem confirmação;
- remover dados silenciosamente;
- usar LLM para somar calorias, calcular médias ou executar fórmulas;
- enviar o banco inteiro a um provedor de IA;
- colocar chaves (OpenAI, WhatsApp) no renderer;
- registrar prompts com dados de saúde em logs inseguros;
- alterar dieta, treino ou metas sem confirmação;
- diagnosticar doenças, prescrever medicamento ou tratamento, ou
  recomendar dose terapêutica de suplemento;
- tratar estimativa de BF como medição exata;
- interpretar correlação como causalidade;
- implementar WhatsApp por automação de navegador;
- criar telas, regras ou padrões fixos por sexo (sexo só pré-seleciona
  sugestões);
- aplicar uma configuração de acompanhamento sem o aceite do usuário;
- mostrar dados pessoais na tela de seleção de perfil;
- implementar funcionalidades futuras antes da fase atual estar estável.

---

## 32. Prioridade e fluxo de desenvolvimento

### 32.1 Prioridade

```text
CORREÇÃO → PERSISTÊNCIA → USABILIDADE → TESTES → POLIMENTO → NOVAS FUNCIONALIDADES
```

Não priorizar animações, IA ou recursos comerciais sobre integridade dos
dados.

### 32.2 Fluxo por etapa

1. Ler este documento.
2. Identificar a versão atual.
3. Não implementar versões futuras sem solicitação.
4. Propor os arquivos que serão alterados.
5. Criar migration quando o banco mudar.
6. Implementar.
7. Executar lint.
8. Executar typecheck.
9. Executar testes.
10. Executar build.
11. Corrigir erros.
12. Atualizar a documentação.
13. Informar exatamente o que foi concluído.

Sempre que possível, entregar uma versão **buildada e pronta para teste**
além do código-fonte.

### 32.3 Definition of Done

Uma tarefa está concluída quando: compila; tem tipagem válida; não quebra
migrations; persiste dados corretamente; mantém isolamento entre perfis;
trata erros; tem testes relevantes; não introduz regressões conhecidas;
a documentação foi atualizada; o fluxo foi testado; e o build final é
executável quando aplicável.

---

## 33. Questões em aberto

Decisões que serão tomadas quando a versão correspondente começar.

**Decididas em 06/10/2026:**

| Questão | Decisão |
|---|---|
| Mesmo computador ou computadores diferentes? | Os dois cenários (§2.5). Transferência de perfil por arquivo na V0.7 (§14.4). |
| Importação de CSV na V0.1? | Sim (§8.8). |
| Backup automático? | Sim, na V0.1 (§8.7.2). |
| Data de nascimento do seed. | 16/08/1994. |
| Data-alvo da V0.1. | O quanto antes; sem data fixa. |

**Decididas em 26/10/2026 (início da V0.4):**

| Questão | Decisão |
|---|---|
| Passos vêm de hábitos, de cardio ou de ambos? | Os dois, sem somar: o total do dia é um hábito de quantidade (com meta); uma sessão de cardio pode guardar os passos dela, só como dado da sessão (§11.1, §11.2). |

**Decididas em 27/10/2026 (V0.5):**

| Questão | Decisão |
|---|---|
| Atualização automática: quando e onde publicar? | Antecipada da V1.0 (0.5.0-alpha.3). `electron-updater` busca as versões no repositório **público só de releases** `lbcamargo94/evully-releases`; o código continua privado. O app procura só ao abrir e no botão "Verificar atualizações" (sem verificação periódica, para não gastar recursos), baixa em segundo plano e instala a versão verificada ao fechar o app ou quando a pessoa clica em "Reiniciar e atualizar", sempre depois do backup de fechamento. Canal em Configurações › Sobre: pré-versões (padrão durante o desenvolvimento) ou só estáveis. Segurança em [SECURITY.md](SECURITY.md), §2.8. |

**Decididas em 21/10/2026 (início da V0.2):**

| Questão | Decisão |
|---|---|
| O catálogo de alimentos é compartilhado entre perfis da casa ou por perfil? | Compartilhado; o resto da nutrição é por perfil (§6.1, §9.2). |
| Água é registrada como hábito de quantidade ou como parte da nutrição? | Na nutrição, já na V0.2 (§9.4.1). |
| Metas nutricionais aceitam faixa ou só valor único? | Só valor único por enquanto (§9.6). |

Nenhuma pendência bloqueia os wireframes da V0.1. As preferências de
cada pessoa são resolvidas pelo questionário (§8.2); o interesse em
recursos futuros é coletado pelos passos 6 e 7 e pelo uso real (§33.1).

**Demais questões:**

| Questão | Versão |
|---|---|
| Fotos de progresso são criptografadas em disco? | futuro |
| Criptografar o banco (ex.: SQLCipher) antes do Evully Health? | V1.4 |
| Assinatura de código (Authenticode) do instalador. | V1.0 |
| Confirmar Better Auth como solução de autenticação. | Início da Fase 2 |
| Provedor de hospedagem e de pagamentos. | Início da Fase 2 / Fase 3 |
| Tipos de medida personalizados por perfil. | futuro |
| Acompanhamento do ciclo menstrual (opcional, ativado no perfil): registrar início do ciclo, mostrar fases no gráfico de peso, comparar o mesmo ponto entre ciclos. Dado sensível: privado, fora dos logs, exportação só com escolha explícita. Sem previsões nem interpretações. | após conversa (V0.1.1 ou V0.4) |
| Status "pausado" no projeto (gestação, lesão, viagem): congela a contagem de dias e as diferenças, sem incentivar perda de peso no período. | após conversa |
| Prioridade das fotos de progresso. | após conversa |
| Registro de bioimpedância antes da V1.1, se houver balança. | após conversa |
| PIN opcional por perfil (candidato à V0.2). | após conversa |

### 33.1 Descoberta com o segundo perfil

As preferências individuais (objetivo, medidas, exibição do peso) são
resolvidas pelo próprio questionário (§8.2). O que o questionário não
cobre são funcionalidades que ainda não existem (ciclo, fotos, PIN,
registro pelo celular). Elas são descobertas assim:

- o **primeiro uso real do questionário** pelo segundo perfil serve como
  teste de usabilidade;
- o passo 6 do questionário registra interesse em ciclo, fotos, PIN e
  registro pelo celular (§8.2.4), e o passo 7 coleta o que a pessoa
  queria acompanhar e não encontrou;
- depois de 1 a 2 semanas de uso, uma conversa curta com as perguntas
  abaixo decide as questões em aberto da tabela anterior.

1. Qual é o seu objetivo agora: perder, ganhar, manter ou mudar a forma
   do corpo?
2. Quais medidas você quer acompanhar? (mostrar o catálogo da §8.3)
3. Você prefere ver o peso todo dia, só a tendência, ou prefere não ver?
4. Você gostaria de registrar o ciclo para entender variações de peso?
5. Fotos de progresso são importantes para você?
6. Te incomoda que outra pessoa da casa possa ver seus dados? Um PIN
   ajudaria?
7. Quando e onde você registraria o peso: no celular ou no computador?
8. O que te faria desistir de usar o app?

Depois da conversa, as decisões são registradas neste documento.

### 33.2 Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Registrar pelo computador todo dia é trabalhoso e o uso cai. | Alto: o sucesso da Fase 1 depende do uso diário. | Registro de peso em poucos segundos ao abrir o app; perguntar na descoberta (§33.1, item 7); celular entra na Fase 2. |
| Perda de dados por falha do disco. | Alto. | Backup manual e automático na V0.1, com pasta adicional fora do disco (§8.7); restauração na V0.7. |
| Banco colocado em pasta sincronizada e usado por dois computadores. | Alto: corrupção. | Não suportado e explicado na interface ao escolher pastas; sincronização só na Fase 2 (§2.5). |
| O questionário aumenta o escopo da V0.1. | Médio: atrasa a entrega. | Só perguntas que a V0.1 usa; regras simples e tabeladas (§8.2.2). |
| Testes com `ELECTRON_RUN_AS_NODE` não funcionarem com alguma ferramenta. | Baixo. | Alternativa: compilar o better-sqlite3 também para o Node e alternar antes dos testes. |
| Empacotamento com electron-builder em monorepo (npm workspaces) com módulo nativo. | Resolvido em 07/10/2026. | Instalador gerado e app empacotado validado: abre, cria o banco e aplica as migrations. |
| Segundo perfil não se identificar com o app. | Alto. | Questionário configurável; segundo perfil como primeiro testador; passos 6 e 7 e conversa após 1 a 2 semanas de uso (§33.1). |

---

## 34. Objetivo final

O Evully deve começar como:

> **Uma ferramenta local que Lucas e sua esposa realmente utilizam todos
> os dias.**

O sucesso da primeira fase NÃO é medido pelo número de funcionalidades,
e sim por facilidade de uso, confiança nos dados, consistência de
registro, utilidade prática e estabilidade.

Depois de meses de uso real, os recursos que comprovadamente agregarem
valor formarão a base da versão Web e, futuramente, do produto
comercial.

### Resumo para a IA de código

> Construa incrementalmente o Evully, um aplicativo desktop fitness
> local-first, multi-perfil, com React + TypeScript + Electron + SQLite,
> em um monorepo TypeScript cujas regras de negócio (`packages/domain`)
> serão compartilhadas com o app web, o celular e a API NestJS.
> Priorize integridade dos dados, separação entre domínio/UI/persistência,
> migrations, backup e possibilidade futura de migração para
> Web/PostgreSQL. Não implemente SaaS, pagamentos, cloud ou recursos
> futuros antes de serem solicitados. A primeira entrega deve permitir
> criar/selecionar perfis, configurar o acompanhamento por um
> questionário com regras determinísticas, registrar peso e medidas,
> visualizar a evolução em um painel que se adapta ao perfil e manter
> tudo persistido localmente. Toda evolução posterior respeita o
> roadmap da §4.

---

## 35. Propriedade intelectual e licença

### 35.1 Licença

O Evully é **software proprietário**. Todos os direitos são reservados
ao titular, conforme o arquivo [LICENSE](LICENSE). O `package.json` usa
`"license": "UNLICENSED"` e `"private": true`, o que impede publicação
acidental no npm.

Se no futuro parte do projeto for aberta, a decisão e a nova licença
serão registradas aqui. Código já publicado sob licença aberta não pode
ter essa licença revogada, por isso abrir é uma decisão deliberada.

### 35.2 Proteção contra cópia

Aplicativos Electron não conseguem ocultar seu código: o pacote `.asar`
pode ser extraído. Ofuscação foi descartada porque só atrasa a cópia e
dificulta a depuração. A proteção do Evully vem de:

1. **Repositório privado**: o código-fonte não é distribuído.
2. **Licença proprietária** e avisos de copyright: base legal.
3. **Histórico do git**: prova datada de autoria.
4. **Registro de programa de computador no INPI** (opcional): reforça a
   prova de autoria em disputas.
5. **Registro da marca "Evully" no INPI**: antes de qualquer uso
   comercial.
6. **Fase 3**: a lógica de maior valor (Analytics avançado, Coach)
   roda no servidor e não é distribuída.

### 35.3 Respeito a terceiros

- Não copiar código, textos, ícones ou dados de outros produtos sem
  licença compatível.
- Dependências passam por verificação de licença no CI; licenças
  copyleft fortes (GPL, AGPL, SSPL) são bloqueadas.
- Avisos exigidos pelas licenças de terceiros ficam em
  `THIRD_PARTY_NOTICES`, gerado por `npm run notices` a partir dos pacotes
  incluídos no app; o CI falha se o arquivo estiver desatualizado. Ele e o
  `LICENSE` vão no instalador e aparecem em Configurações — Sobre.
- Bases de dados nutricionais (V0.2) só podem ser importadas se a
  licença da base permitir; a fonte fica registrada em `foods.source`.
