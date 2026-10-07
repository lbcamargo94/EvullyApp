# Evully

> Aplicativo desktop local para acompanhamento de treino, dieta,
> composição corporal, cardio, sono e hábitos, projetado desde o início
> para evoluir posteriormente para uma aplicação web e, em uma fase
> futura, para um produto SaaS comercial.

Este documento é a **especificação do produto** e a referência para todo o
desenvolvimento. Ele é versionado junto com o código e deve ser atualizado
sempre que uma decisão mudar.

**Fase atual:** V0.1 — Fundação + perfis + peso + medidas + dashboard + backup mínimo.

**Licença:** proprietária, todos os direitos reservados ([LICENSE](LICENSE)).
**Segurança:** modelo e regras em [SECURITY.md](SECURITY.md).

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
- deve existir backup (desde a V0.1) e restauração (a partir da V0.7);
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

### 2.5 Saúde e segurança

O aplicativo é uma ferramenta de registro e planejamento e não deve se
apresentar como médico, nutricionista ou fisioterapeuta.

Recomendações automáticas futuras devem ser conservadoras. Sintomas,
lesões, medicamentos, hormônios e decisões clínicas devem permanecer sob
responsabilidade de profissionais habilitados.

### 2.6 Cálculos determinísticos

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
| **Pesagem** | Um registro de peso. | `body_weights` |
| **Sessão de medidas** | Um conjunto de medidas tomadas no mesmo momento. | `body_measurements` |
| **Tipo de medida** | Abdômen, peitoral, bíceps direito etc. | `measurement_types` |
| **Peso do dia** | Valor de peso considerado para um dia (ver §7.2). | derivado |

> A tabela antes chamada `goals` passa a se chamar `projects`.

---

## 4. Roadmap

Este é o **único** roadmap do projeto.

| Versão | Escopo |
|---|---|
| **V0.1** | Fundação + perfis + projetos + peso + medidas + dashboard + backup mínimo |
| V0.2 | Nutrição: alimentos, refeições, metas nutricionais |
| V0.3 | Treino: exercícios, planos, execução, séries, progressão |
| V0.4 | Cardio + hábitos |
| V0.5 | Sono |
| V0.6 | Estatísticas e dashboard completo |
| V0.7 | Backup completo, restauração e exportação JSON/CSV |
| V0.8 | UX/polimento |
| V1.0 | Desktop estável + instalador Windows |
| V1.1 | Analytics Engine determinístico |
| V1.2 | Recommendation Engine determinístico |
| V1.3 | Notificações locais / Evully Reminders |
| V1.4 | Evully Health (estrutura local/manual) |
| V1.5 | Evully Coach AI opcional (desenvolvimento/testes) |
| V2.x | Web + backend + autenticação + PostgreSQL + sincronização |
| V2.x | Evully Cloud + IA server-side |
| V2.x | WhatsApp oficial / push / e-mail |
| V3.x | SaaS comercial + planos + billing + mobile/PWA |

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
| Shell desktop | Electron | Requisito do projeto. |
| Build | electron-vite 5 + **Vite 7** | electron-vite 5 não suporta Vite 8; Vite fica fixado na 7. |
| UI | React + TypeScript | Reaproveitável na versão web. |
| Linguagem | **TypeScript 6.0.x** | typescript-eslint ainda não suporta TS ≥ 6.1. |
| Estilo | Tailwind CSS 4 + componentes no estilo shadcn/ui | Interface limpa e reutilizável na web. |
| Banco | SQLite via **better-sqlite3** | Síncrono, estável, rápido. Precisa ser recompilado para o Electron. |
| Acesso a dados | **Kysely** | Query builder tipado, migrations embutidas, suporta PostgreSQL. |
| Validação | zod | Validação de toda entrada que atravessa o IPC. |
| Gráficos | Recharts | Simples e suficiente para séries temporais. |
| Roteamento | React Router (HashRouter) | Compatível com `file://` no app empacotado. |
| Testes | Vitest | Rodando com `ELECTRON_RUN_AS_NODE=1` para usar o mesmo binário do better-sqlite3. |
| Qualidade | ESLint + typescript-eslint + Prettier | — |
| Instalador | electron-builder (NSIS) | Gera `Evully-Setup.exe`. |

As versões exatas ficam fixadas no `package.json`. Qualquer troca de peça
desta tabela deve ser registrada aqui com o motivo.

### 5.2 Camadas

```text
UI (React, processo renderer)
 ↓  IPC tipado (preload + contextBridge)
Application / Services      ← processo main
 ↓
Domain (funções puras)
 ↓
Repositories
 ↓
SQLite
```

- Domínio, serviços e repositórios rodam no **processo main**.
- O renderer não acessa Node, arquivos nem banco. Ele só chama a API
  exposta pelo preload, com `contextIsolation` ativo e `nodeIntegration`
  desligado.
- Toda chamada IPC tem contrato tipado em `shared/` e entrada validada
  com zod no main.
- A regra de negócio NÃO fica em componentes React.
- Na versão web, o mesmo contrato da UI passa a ser atendido por uma API
  HTTP no lugar do IPC.

### 5.3 Estrutura de pastas

```text
src/
  shared/        contratos IPC, DTOs, tipos comuns (sem Node e sem React)
  domain/        regras puras e testáveis
  database/      conexão, schema tipado, migrations, seed
  repositories/  acesso a dados por entidade
  services/      casos de uso (orquestram domínio + repositórios)
  main/          ciclo de vida do Electron, janelas, IPC, caminhos, logs
  preload/       ponte segura entre main e renderer
  renderer/
    components/  componentes visuais reutilizáveis
    features/    telas e fluxos por módulo
    lib/         cliente da API, contextos
tests/           testes de domínio, repositórios e migrations
```

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

### 5.5 Padrões de implementação

| Tema | Padrão |
|---|---|
| Montagem das dependências | **Composition root manual** em `main/`, sem container de DI. Serviços dependem de *interfaces* de repositório, o que permite testes com implementações falsas e, na Fase 2, a troca por uma API. |
| IPC | **Mapa de canais tipado** em `shared/` (ex.: `'weights:create'` → entrada/saída). Cada canal tem um schema zod; os handlers são registrados a partir do mapa. O renderer usa uma API tipada (`api.weights.create(...)`). Não existe canal genérico de SQL ou de arquivos. |
| Erros | Serviços lançam erros de domínio tipados (`ValidationError`, `NotFoundError`, `ConflictError`). A camada IPC converte para `{ ok: true, data }` ou `{ ok: false, error: { code, message } }`. Stack traces vão para o log, nunca para a tela. |
| Dados no renderer | **TanStack Query** para cache, carregamento e invalidação após gravações. |
| Formulários | **react-hook-form + zod**, reaproveitando os schemas de `shared/`. A validação é escrita uma vez e roda nos dois lados. |
| Tempo | Um `Clock` injetado nos serviços. Nenhuma regra chama `new Date()` diretamente, para que "hoje" seja controlável nos testes. |
| Logs | **electron-log** em `%APPDATA%\Evully\logs`, com rotação. Mensagens não contêm dados pessoais (peso, medidas, nomes). |

Exemplo de fluxo — registrar peso:

```text
WeightForm (react-hook-form + schema zod)
  → api.weights.create()                renderer
  → preload → ipcMain 'weights:create'
  → valida com o mesmo schema zod       main
  → WeightService.create()              arredonda, define measured_on
  → WeightRepository.insert()           grava com profile_id
  ← { ok: true, data }                  TanStack Query atualiza dashboard e lista
```

### 5.6 Segurança

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
| `id` | TEXT (UUID v4) | Chave primária. Facilita sincronização futura. |
| `created_at` | TEXT (ISO 8601, UTC) | Preenchido na criação. |
| `updated_at` | TEXT (ISO 8601, UTC) | Atualizado em toda alteração. |
| `deleted_at` | TEXT (ISO 8601, UTC), nulo | Soft delete em entidades com dados do usuário. |

Toda tabela com dados pessoais possui `profile_id` com chave estrangeira
para `profiles`. As seções seguintes descrevem apenas as colunas
específicas de cada tabela.

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

Todas as regras abaixo são implementadas em `domain/` e possuem testes.

### 7.1 Projeto

- **Dia atual** = `(hoje − start_date) + 1`. O dia inicial é o dia 1.
- **Total de dias** = `(target_date − start_date) + 1`.
  Exemplo: 05/10/2026 → 06/12/2026 = **63 dias**.
- **Dias até a meta** = `target_date − hoje`.
- Antes do início, exibir "Começa em N dias". Depois do prazo, exibir
  "Prazo encerrado".
- Cada perfil tem no máximo **um projeto ativo**. O projeto atual é o
  projeto ativo.

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

### 7.4 Idade

Calculada a partir de `birth_date` na data de referência. Nunca é gravada.

### 7.5 Sono (V0.5)

- Uma noite de sono pertence ao **dia em que a pessoa acorda**
  (`sleep_date` = data local de `wake_time`).
- `duration_minutes` é sempre derivado de `sleep_time` (ou `bed_time`,
  se `sleep_time` estiver vazio) até `wake_time`. É gravado para facilitar
  consultas, mas só o serviço o calcula; nunca é editado diretamente.

---

## 8. V0.1 — Fundação, perfis, peso e medidas

### 8.1 Fluxo inicial

```text
Abrir Evully
      ↓
Selecionar perfil
      ↓
Dashboard
```

Tela inicial:

```text
Quem está usando?

[ Lucas ]
[ + Adicionar perfil ]
```

Não há login nem senha na Fase 1. Perfis separam os dados, mas **não são
uma barreira de segurança**: quem usa a conta do Windows acessa todos os
perfis (ver [SECURITY.md](SECURITY.md)).

### 8.2 Tabelas

#### `profiles`

| Coluna | Regra |
|---|---|
| `name` | Obrigatório. |
| `birth_date` | Opcional. Usada para idade e, no futuro, TMB. |
| `sex` | Opcional: `male`, `female` ou nulo. |
| `height_cm` | Opcional. |
| `avatar_path` | Opcional. Caminho relativo ao diretório de dados. |
| `unit_system` | `metric` (padrão). Afeta apenas exibição. |

#### `projects`

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `name` | Obrigatório. |
| `start_date` | Obrigatória. |
| `target_date` | Obrigatória, maior ou igual a `start_date`. |
| `status` | `active`, `completed`, `archived`. No máximo um `active` por perfil. |
| `notes` | Opcional. |

#### `body_weights`

| Coluna | Regra |
|---|---|
| `profile_id` | Obrigatório. |
| `measured_on` | Data local da pesagem. |
| `measured_at` | Instante da pesagem. |
| `weight_kg` | Obrigatório, 20–400. |
| `notes` | Opcional. |

#### `measurement_types`

Catálogo do sistema, sem `profile_id` e sem `deleted_at`.

| Coluna | Regra |
|---|---|
| `code` | Único. Ex.: `abdomen`. |
| `name` | Nome exibido. |
| `unit` | `cm`. |
| `sort_order` | Ordem de exibição. |
| `is_active` | Tipos inativos não aparecem nos formulários. |

Tipos iniciais (criados pela migration):

| code | name | ativo |
|---|---|---|
| `abdomen` | Abdômen/cintura | sim |
| `chest` | Peitoral | sim |
| `right_biceps` | Bíceps direito | sim |
| `left_biceps` | Bíceps esquerdo | sim |
| `right_thigh` | Coxa direita | sim |
| `left_thigh` | Coxa esquerda | sim |
| `glutes` | Glúteos/quadril | sim |
| `calves` | Panturrilhas | não |
| `neck` | Pescoço | não |

Tipos personalizados por perfil ficam para depois (coluna `profile_id`
nula = tipo do sistema).

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
pelo menos um valor.

#### `settings`

| Coluna | Regra |
|---|---|
| `profile_id` | Nulo para configurações globais. |
| `key` | Ex.: `theme`, `last_profile_id`. |
| `value` | JSON em texto. |

Único por `(profile_id, key)`.

### 8.3 Telas

| Tela | Conteúdo |
|---|---|
| Seleção de perfil | Lista de perfis + "Adicionar perfil". |
| Cadastro/edição de perfil | Campos de `profiles`. |
| Dashboard | Ver §8.4. |
| Peso | Registrar, editar e excluir pesagens; lista; gráfico. |
| Medidas | Registrar sessão de medidas; histórico; gráfico do abdômen. |
| Configurações | Projeto (criar, editar, concluir), tema claro/escuro, backup, versão do app. |

No topo de todas as telas: `Perfil atual: Lucas ▼`. Trocar de perfil
nunca mistura registros.

### 8.4 Dashboard V0.1

```text
SHAPE DE PRAIA
Dia 18 / 63 · faltam 45 dias

Peso atual       89.8 kg
Peso inicial     92.0 kg
Diferença        −2.2 kg
Média 7 dias     90.1 kg

Abdômen          93.4 cm (−2.6 cm)
```

Sem projeto ativo, o dashboard convida a criar um.

### 8.5 Gráficos

- Peso do dia ao longo do tempo;
- média móvel de 7 dias (sobreposta ao peso);
- abdômen ao longo do tempo.

### 8.6 Backup mínimo

- Botão "Fazer backup" em Configurações.
- O banco é copiado com `VACUUM INTO` (nunca copiando o arquivo aberto).
- Gera `evully-backup-YYYY-MM-DD-HHMM.zip` contendo:

```text
evully.db
manifest.json   { app_version, schema_version, created_at, sha256 }
```

- O usuário escolhe a pasta de destino. Um arquivo existente nunca é
  sobrescrito sem confirmação.
- Restauração fica para a V0.7.

### 8.7 Seed de desenvolvimento

Executado apenas por comando de desenvolvimento, nunca no app instalado.

```text
Perfil:   Lucas · masculino · 175 cm · data de nascimento configurável
Projeto:  Shape de Praia · 05/10/2026 → 06/12/2026 · ativo
Peso:     92.0 kg em 05/10/2026
Medidas em 05/10/2026:
  Abdômen 96 · Peitoral 115 · Bíceps D 42 · Bíceps E 42.5
  Coxa D 60 · Coxa E 61 · Glúteos 109
```

O segundo perfil não é criado pelo seed; ele é criado pela interface.
As metas nutricionais do seed estão em §9.7 e entram na V0.2.

### 8.8 Critérios de aceite V0.1

1. O aplicativo abre no Windows.
2. O usuário cria dois perfis.
3. O usuário alterna entre perfis.
4. Dados de um perfil não aparecem no outro.
5. O usuário registra peso.
6. O usuário registra medidas.
7. Os dados permanecem após reiniciar.
8. O dashboard mostra o peso atual.
9. O dashboard mostra a evolução básica (§8.4).
10. O banco SQLite é criado automaticamente.
11. As migrations funcionam e são testadas.
12. Erros básicos são tratados e registrados em log.
13. Existe backup manual.

Não começar nutrição ou treino antes de esse núcleo estar confiável.

---

## 9. V0.2 — Nutrição

### 9.1 Objetivo

Permitir planejar e registrar alimentação sem transformar o aplicativo em
uma plataforma nutricional complexa.

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

### 9.5 Recursos

- cadastrar, editar e excluir alimento não utilizado;
- montar refeição;
- salvar refeição favorita (`meal_templates`);
- duplicar refeição;
- "repetir refeição de ontem";
- marcar refeição como consumida;
- alterar quantidade e recalcular macros imediatamente;
- mostrar total diário.

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

### 9.7 Metas iniciais do seed

```text
Calorias: 2400 kcal/dia
Proteína: 190 g/dia
Água:     3500 ml/dia
```

Editáveis, nunca codificadas na lógica.

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
Calorias      1680 / 2400 kcal
Proteína       132 / 190 g
Carboidratos   xxx / meta
Gorduras        xx / meta
```

---

## 10. V0.3 — Treino

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

### 10.5 Histórico por exercício

Última sessão, melhor carga, melhor série, evolução, volume, frequência e
histórico completo.

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

### 11.2 Hábitos

Sistema genérico; nunca uma coluna por hábito.

```text
habit_definitions   profile_id, name, type, unit nulo, target_value nulo, is_active
habit_logs          habit_definition_id, profile_id, log_date, value, notes
```

Tipos: booleano, quantidade, duração, horário.

Exemplos: creatina, água, passos, caminhada, treino, cardio, horário de
sono.

---

## 12. V0.5 — Sono

### 12.1 `sleep_logs`

```text
profile_id
sleep_date          data em que a pessoa acorda (§7.5)
bed_time
sleep_time          nulo
wake_time
duration_minutes    derivado (§7.5)
quality             nulo
notes
```

Interface simples:

```text
Dormiu:   23:48
Acordou:  07:42
Total:    7h54
```

### 12.2 Indicadores

Média de 7 dias, média de 30 dias, consistência, horário médio de dormir
e horário médio de acordar.

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
Dia 18 / 63

Peso       89.8 kg   −2.2 kg desde o início
Abdômen    93.4 cm   −2.6 cm

HOJE
Calorias   1680 / 2400
Proteína    132 / 190 g
Água        2.1 / 3.5 L
Passos     6420 / 8000
Sono       7h12 / 8h
Treino     18:00 — PULL

[ COMEÇAR TREINO ]
```

### 13.2 Estatísticas

Gráficos separados para peso do dia, média móvel, média semanal,
velocidade de mudança (kg/semana), cintura, outras medidas, calorias,
proteína, sono, cardio, passos, cargas, volume de treino e frequência.

Não sobrecarregar o dashboard com todos os gráficos.

### 13.3 Análise de evolução

Depois de dados suficientes, gerar resumos objetivos por funções
testáveis:

```text
Últimos 14 dias
Peso médio:      −0.62 kg/semana
Abdômen:         −1.2 cm
Treinos:         9/10 concluídos
Proteína média:  188 g/dia
Sono médio:      7h31
Performance:     estável
```

Sem aconselhamento médico automático.

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

### 14.3 Exportação

- JSON completo;
- CSV por categoria: `weights.csv`, `measurements.csv`, `workouts.csv`,
  `exercise_sets.csv`, `nutrition.csv`, `sleep.csv`, `cardio.csv`.

---

## 15. V0.8 a V1.0 — Polimento e distribuição Windows

Objetivo: `Evully-Setup.exe`.

- instalador e atalhos;
- atualização manual inicialmente;
- diretório de dados separado do executável (§5.4);
- desinstalação não apaga dados pessoais sem confirmação explícita;
- logs locais de erro;
- versão exibida no aplicativo.

O instalador não terá assinatura digital na Fase 1, então o Windows
SmartScreen exibirá um aviso na instalação. Isso é aceitável para uso
doméstico.

---

## 16. UX/UI

### 16.1 Diretrizes

- limpa, moderna e rápida;
- desktop-first na Fase 1, já considerando responsividade para a web;
- evitar excesso de informação;
- modo claro/escuro;
- acessibilidade básica (contraste, foco visível, navegação por teclado).

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
| Corpo | `body_weights`, `measurement_types`, `body_measurements`, `body_measurement_values` | V0.1 |
| Corpo | `progress_photos`, `body_targets`, `body_composition_records` | futuro |
| Nutrição | `nutrition_targets`, `foods`, `meal_templates`, `meal_template_items`, `food_logs` | V0.2 |
| Nutrição | `recipes`, `recipe_items` | V0.2+ |
| Treino | `exercises`, `workout_plans`, `workout_days`, `workout_plan_exercises`, `workout_sessions`, `exercise_performances`, `exercise_sets` | V0.3 |
| Cardio | `cardio_sessions` | V0.4 |
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

---

## 18. Testes

### 18.1 Regras de negócio (unitários)

- dias do projeto;
- peso do dia, peso inicial, diferença;
- média móvel de 7 dias;
- cálculo de macros e soma de refeições;
- duração do sono;
- progressão dupla;
- cálculo de volume.

### 18.2 Persistência (integração, SQLite real em memória ou temporário)

- migrations do zero até a última;
- isolamento entre perfis em todos os repositórios;
- soft delete;
- backup e, a partir da V0.7, restauração.

### 18.3 Fluxos críticos (interface)

```text
criar perfil
registrar peso
registrar refeição
iniciar treino
salvar série
finalizar treino
fechar aplicativo
abrir novamente
confirmar persistência
```

---

## 19. Critérios de aceite da Fase Desktop

Ao final da V1.0 o usuário deve conseguir: criar perfis; criar projetos;
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

Dados de saúde, exames, medidas, fotos, dieta e treino podem ser
sensíveis. O produto comercial segue privacy by design e a LGPD.

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

Preferir histórico a sobrescrita para tudo que afeta análises: metas
nutricionais e corporais, programas de treino, recomendações e decisões,
métodos de BF, preferências de notificação, consentimentos e resultados
laboratoriais corrigidos.

A análise de uma data passada usa a meta vigente naquela data.

---

## 29. Fase 2 — Aplicação Web

Somente após validação do desktop.

Stack planejada:

```text
Frontend   Next.js + React + TypeScript (reaproveita componentes da Fase 1)
Backend    API em ASP.NET Core (C#) + EF Core
Banco      PostgreSQL
```

O contrato tipado usado hoje pelo IPC passa a ser atendido pela API
HTTP. As regras de `domain/` são portadas para C# junto com seus testes,
que servem de especificação executável.

Entram: autenticação, contas, acesso pelo celular, backend/API,
sincronização, armazenamento remoto, segurança web e importação do
histórico desktop ("Exportar conta" no desktop → "Importar dados do
Evully Desktop" na web), incluindo perfis, pesos, medidas, alimentos,
refeições, treinos, séries, cardio, hábitos e sono. Os UUIDs permitem
importar sem conflito de IDs.

---

## 30. Fase 3 — SaaS comercial

Somente depois de validação por uso real. Nenhuma destas
funcionalidades deve complicar a Fase 1.

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

Decisões que serão tomadas quando a versão correspondente começar:

| Questão | Versão |
|---|---|
| Água é registrada como hábito de quantidade ou como parte da nutrição? | V0.2 / V0.4 |
| Passos vêm de hábitos, de cardio ou de ambos? | V0.4 |
| O catálogo de alimentos é compartilhado entre perfis da casa ou por perfil? | V0.2 |
| Metas nutricionais aceitam faixa (ex.: água 3–3.5 L) ou só valor único? | V0.2 |
| Fotos de progresso são criptografadas em disco? | futuro |
| Criptografar o banco (ex.: SQLCipher) antes do Evully Health? | V1.4 |
| PIN opcional por perfil? | futuro |
| Assinatura de código (Authenticode) do instalador. | V1.0 |
| Tipos de medida personalizados por perfil. | futuro |

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
> local-first, multi-perfil, com React + TypeScript + Electron + SQLite.
> Priorize integridade dos dados, separação entre domínio/UI/persistência,
> migrations, backup e possibilidade futura de migração para
> Web/PostgreSQL. Não implemente SaaS, pagamentos, cloud ou recursos
> futuros antes de serem solicitados. A primeira entrega deve permitir
> criar/selecionar perfis, registrar peso e medidas, visualizar evolução
> e manter tudo persistido localmente. Toda evolução posterior respeita o
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
  `THIRD_PARTY_NOTICES`, gerado a partir das dependências.
- Bases de dados nutricionais (V0.2) só podem ser importadas se a
  licença da base permitir; a fonte fica registrada em `foods.source`.
