# Arquitetura do Evully

Como o código do Evully é organizado e quais regras ele deve seguir em
todas as aplicações (desktop, API, web e celular). Complementa a
especificação no [README](README.md), as regras de segurança em
[SECURITY.md](SECURITY.md) e o design system em [DESIGN.md](DESIGN.md).

## 1. Visão geral

O Evully usa **Clean Architecture pragmática** organizada como
**monólito modular**, em um **monorepo TypeScript**.

- **Clean Architecture**: as regras de negócio não dependem de framework,
  banco ou interface. As dependências apontam sempre para dentro.
- **Pragmática**: só as camadas e abstrações que trazem benefício real.
  Nada de cerimônia por padrão (§6).
- **Monólito modular**: o código é dividido por módulo de negócio
  (`body`, `tracking`, `accounts`…), e cada módulo tem suas camadas.
- **Monorepo TypeScript**: as regras (`packages/domain`) e os contratos
  (`packages/contracts`) são escritos uma vez e usados por todas as
  aplicações.

## 2. Camadas e regra de dependência

```text
┌──────────────────────────────────────────────────────────┐
│ Frameworks e interface                                   │
│ Electron · React · NestJS · Next.js · SQLite · PostgreSQL│
│  ┌────────────────────────────────────────────────────┐  │
│  │ Adaptadores                                        │  │
│  │ repositórios Kysely · handlers IPC · controllers   │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Aplicação                                    │  │  │
│  │  │ casos de uso · ports (interfaces)            │  │  │
│  │  │  ┌────────────────────────────────────────┐  │  │  │
│  │  │  │ Domínio (packages/domain)              │  │  │  │
│  │  │  │ entidades · value objects · regras     │  │  │  │
│  │  │  └────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
          as dependências apontam sempre para dentro
```

| Camada | Contém | Pode importar | Não pode importar |
|---|---|---|---|
| **Domínio** | Tipos de entidades, value objects (ex.: `WeightKg`), regras e cálculos puros (média de 7 dias, dias do projeto, regras do questionário, direção dos indicadores), erros de domínio | Somente outros arquivos do domínio | Qualquer biblioteca de framework, banco, Node, React, `Date.now()` |
| **Aplicação** | Casos de uso (`RegisterWeight`, `AcceptTrackingProposal`), **ports** (interfaces de repositório, relógio, armazenamento) | Domínio, `packages/contracts` | Kysely, Electron, NestJS, React, Node (`fs`, `path`) |
| **Adaptadores** | Implementações dos ports (repositórios Kysely, relógio do sistema), handlers IPC, controllers HTTP, mapeamento entre linhas do banco e entidades | Aplicação, domínio, contratos, bibliotecas de infraestrutura | Interface (React) |
| **Frameworks e interface** | Bootstrap do Electron/NestJS, composition root, telas React | Tudo que for necessário para montar a aplicação | — |

Regras derivadas:

- O domínio recebe o "agora" como parâmetro. Quem fornece é o port
  `Clock`, implementado no adaptador.
- Casos de uso recebem dependências pelo construtor, sempre como
  interfaces (ports).
- `packages/contracts` (schemas zod) é usado na fronteira: valida entrada
  em IPC, HTTP e formulários. O domínio não depende de zod.

## 3. Onde cada camada vive

| Camada | Desktop (`apps/desktop`) | API (`apps/api`, Fase 2) | Web/celular (`apps/web`, Fase 2) |
|---|---|---|---|
| Domínio | `packages/domain` | `packages/domain` | `packages/domain` (apenas cálculos de exibição) |
| Aplicação | `src/modules/*/application`, `ports` | `src/modules/*/application`, `ports` | — (a regra roda na API) |
| Adaptadores | `src/modules/*/adapters` (Kysely + SQLite, handlers IPC) | `src/modules/*/adapters` (Kysely + PostgreSQL, controllers) | cliente HTTP |
| Interface | `src/renderer` (React) + `packages/ui` | — | `app/` (Next.js) + `packages/ui` |
| Composition root | `src/main/composition-root.ts` (manual) | módulos NestJS (`*.module.ts`) | — |

Quando um caso de uso for idêntico no desktop e na API, ele poderá ser
extraído para um pacote `packages/application`. Na V0.1 os casos de uso
ficam no desktop.

## 4. Estrutura por módulo

### 4.1 Desktop

```text
apps/desktop/src/
  main/                  bootstrap do Electron, janelas, composition root,
                         roteador IPC, logs, caminhos
  preload/               ponte segura (contextBridge)
  database/              conexão SQLite, migrations, seed
  shared/                mapa de canais IPC
  modules/
    profiles/
    tracking/
    body/
      application/
        register-weight.ts
        import-weights-csv.ts
      ports/
        weight-repository.ts
      adapters/
        kysely-weight-repository.ts
        weight-ipc-handlers.ts
    backup/
    settings/
  renderer/
    features/            telas por módulo
    lib/                 cliente IPC tipado, TanStack Query, contextos
```

### 4.2 API (Fase 2)

```text
apps/api/src/
  main.ts
  common/                guards (auth, entitlements), filtros de erro,
                         logging, config
  database/              conexão Kysely + PostgreSQL, migrations
  modules/
    body/
      application/       casos de uso
      ports/             interfaces
      adapters/          repositórios Kysely, controllers
      body.module.ts     registro dos providers no NestJS
```

### 4.3 NestJS sem acoplar as regras

- `@Injectable`, decorators e imports de `@nestjs/*` ficam apenas em
  **adaptadores** e arquivos `*.module.ts`.
- Casos de uso são classes TypeScript comuns. O módulo Nest os registra
  com `useFactory`, e as interfaces são injetadas por tokens:

```ts
// body.module.ts
{
  provide: RegisterWeight,
  useFactory: (repo: WeightRepository, clock: Clock) =>
    new RegisterWeight(repo, clock),
  inject: [WEIGHT_REPOSITORY, CLOCK],
}
```

Assim, o mesmo caso de uso pode ser testado sem NestJS e reaproveitado
no desktop.

## 5. Fluxo de uma operação

Registrar peso no desktop:

```text
WeightForm (React + schema zod de packages/contracts)
  → api.body.registerWeight()               renderer
  → preload → IPC 'body:register-weight'
  → handler IPC valida com o mesmo schema   adapter
  → RegisterWeight.execute()                application
      → regras de packages/domain           (arredonda, valida, define measured_on)
      → WeightRepository.insert()           port
  → KyselyWeightRepository                  adapter → SQLite
  ← { ok: true, data }                      TanStack Query atualiza as telas
```

Na API, o handler IPC é substituído por um controller HTTP e o
repositório SQLite por um repositório PostgreSQL. O caso de uso e o
domínio são os mesmos.

## 6. O que não fazer (excesso de cerimônia)

- Não criar *presenters*, *interactors*, *gateways* e DTOs de entrada e
  saída para cada caso de uso. Um caso de uso é uma classe com
  `execute(input)`; a entrada é o tipo inferido do schema zod.
- Não aplicar DDD tático completo (agregados, eventos de domínio,
  repositório por agregado) em todos os módulos. Usar apenas onde houver
  regra complexa (ex.: sincronização, cobrança).
- Não usar CQRS nem Event Sourcing.
- Não criar interface quando só existe uma implementação e ela não
  precisa ser substituída em testes. Ports são obrigatórios para:
  repositórios, relógio, armazenamento de arquivos, serviços externos.
- Não criar camadas genéricas (`BaseRepository<T>`, `BaseService`) antes
  de existirem pelo menos três casos reais.

## 7. Clean Code — regras do projeto

| Regra | Verificação |
|---|---|
| TypeScript em modo estrito, sem `any` | `tsconfig` (`strict`) + ESLint (`no-explicit-any`) |
| Nomes que revelam intenção; código e banco em inglês, interface em português | Revisão |
| Um caso de uso por arquivo, nomeado pelo verbo (`register-weight.ts`) | Revisão |
| Funções com uma responsabilidade; complexidade limitada | ESLint (`complexity`, `max-depth`) |
| Sem números mágicos: limites e constantes nomeados no domínio (ex.: `MIN_WEIGHT_KG = 20`) | ESLint (`no-magic-numbers` no domínio) + revisão |
| Erros tipados (`ValidationError`, `NotFoundError`, `ConflictError`); nunca `throw` de string nem `null` para indicar falha | Revisão + testes |
| Funções puras no domínio; efeitos colaterais apenas nos adaptadores | Regras de fronteira (§8) |
| Comentários explicam o **porquê**, nunca o quê | Revisão |
| Sem código morto nem comentado | ESLint + revisão |
| Formatação automática | Prettier no CI |
| Testes primeiro nas regras de domínio; todo bug corrigido ganha teste | CI + revisão |

## 8. Verificação automática

A arquitetura é garantida pelo CI, não só pela documentação.

**Fronteiras entre camadas** com `eslint-plugin-boundaries`:

| De | Pode importar |
|---|---|
| `packages/domain` | `packages/domain` |
| `packages/contracts` | `packages/contracts`, `zod` |
| `*/application`, `*/ports` | domínio, contratos, ports |
| `*/adapters` | aplicação, ports, domínio, contratos, bibliotecas de infraestrutura |
| `renderer`, `apps/web` | `packages/ui`, `packages/tokens`, contratos, domínio, cliente da API |
| `packages/ui` | `packages/tokens`, React, Radix, Tailwind |

Exemplos que fazem o CI falhar: importar `kysely` em
`packages/domain`; importar um repositório em um componente React;
importar `@nestjs/common` em um caso de uso; importar `electron` em
`packages/ui`.

**Outros controles no CI:** typecheck estrito, ESLint, Prettier, testes
(com cobertura mínima de 90% em `packages/domain`), verificação de
licenças e `npm audit`.

## 9. Registro de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 06/10/2026 | Desktop em Electron + React + TypeScript | Reaproveitamento na web; afinidade com JS. |
| 06/10/2026 | SQLite com Kysely | Tipado, migrations, mesmo query builder no PostgreSQL. |
| 06/10/2026 | Monorepo TypeScript (npm workspaces) | Regras e componentes compartilhados entre plataformas. |
| 06/10/2026 | Backend NestJS (Fastify) + PostgreSQL | Mesma linguagem; regras compartilhadas; estrutura para crescer. C# descartado para o produto. |
| 06/10/2026 | Web em Next.js; celular via PWA e depois Capacitor | Reaproveita Tailwind + shadcn/ui; React Native exigiria refazer componentes. |
| 06/10/2026 | UUID v7 | Ordenado pelo tempo; índices eficientes; sincronização sem conflito. |
| 06/10/2026 | Clean Architecture pragmática + monólito modular | Regras independentes de framework, sem cerimônia excessiva. |
| 06/10/2026 | Licença proprietária | Intenção comercial. |

Novas decisões arquiteturais são adicionadas a esta tabela com data e
motivo.
