# Backend do Evully — API, dados e sincronização

Planejamento do backend do Evully (Fase 2 em diante). Complementa o
[README](README.md) (§29 e §30), a [arquitetura](ARCHITECTURE.md), o
[frontend](FRONTEND.md) e a [segurança](SECURITY.md).

> Nada deste documento é implementado na Fase 1. O desktop já respeita
> os pré-requisitos da §7.1 para que a sincronização seja possível depois.

## 1. Responsabilidades

O backend é a fonte da verdade para contas, assinaturas e dados
sincronizados. Ele atende:

| Cliente | Como usa a API |
|---|---|
| App web / PWA (`apps/web`) | Todas as operações, online, com fila offline simples |
| Apps Android/iOS (`apps/mobile`) | Sincronização de dados locais + operações online (conta, assinatura) |
| Desktop (`apps/desktop`) | Opcional: sincronização quando o usuário conecta uma conta |
| Site (`apps/site`) | Apenas páginas públicas; login redireciona para o app web |
| Provedores externos | Webhooks de pagamento, lojas e e-mail |

## 2. Stack

| Área | Escolha | Observação |
|---|---|---|
| Runtime | Node.js LTS | Mesma linguagem de todo o monorepo |
| Framework | **NestJS** com adaptador **Fastify** | Monólito modular ([ARCHITECTURE.md](ARCHITECTURE.md), §4.2 e §4.3) |
| Validação | **zod** (`nestjs-zod`) com schemas de `packages/contracts` | Sem `class-validator` |
| Banco | **PostgreSQL** gerenciado | Região São Paulo |
| Acesso a dados | **Kysely** (`pg`) | Migrations próprias para PostgreSQL |
| Autenticação | **Better Auth** (a confirmar no início da Fase 2) | Dados de login no nosso banco |
| Filas e agendamento | **pg-boss** | Sem Redis até a escala exigir |
| Arquivos | Armazenamento compatível com S3 | URLs assinadas |
| E-mail | Provedor transacional (ex.: Resend ou Amazon SES) | — |
| Push | Expo Push (mobile) e Web Push (PWA) | — |
| Logs e métricas | pino + OpenTelemetry | Sem dados pessoais |
| Testes | Vitest, Testcontainers, supertest, k6 | §13 |
| Documentação | OpenAPI gerado dos schemas zod | Publicado apenas em ambientes internos |

## 3. Módulos

Cada módulo tem `application/`, `ports/` e `adapters/`
([ARCHITECTURE.md](ARCHITECTURE.md), §4).

| Módulo | Responsabilidade | Fase |
|---|---|---|
| `accounts` | Contas, famílias, perfis, membros, convites, dispositivos | 2 |
| `auth` | Integração com Better Auth, sessões, tokens, login social | 2 |
| `tracking` | Questionário, configurações de acompanhamento, projetos | 2 |
| `body` | Pesos, medidas, etiquetas, importação CSV | 2 |
| `sync` | Sincronização com desktop e mobile (§7) | 2 |
| `files` | Upload e download de arquivos (fotos, exames) | 2–3 |
| `notifications` | E-mail, push, preferências, lembretes | 2 |
| `billing` | Planos, entitlements, assinaturas, webhooks | 3 |
| `privacy` | Exportação de dados, exclusão de conta, consentimentos | 2 |
| `nutrition`, `training`, `cardio`, `habits`, `sleep` | Conforme o roadmap do desktop | 2+ |
| `coach` | Evully Coach AI (server-side) | 2.x |
| `professionals` | Concessões e área de profissionais | 3 |
| `admin` | Painel interno: suporte, métricas, auditoria | 3 |

## 4. Contas, famílias e autorização

### 4.1 Modelo

```text
Conta (pessoa com login)
  └── membro de ── Família (household)
                      └── Perfis (dados pessoais)
                            └── pesos, medidas, configurações…
```

| Entidade | Regra |
|---|---|
| **Conta** | Uma pessoa com login (e-mail/senha ou social). |
| **Família** | Grupo da casa. Toda conta pertence a pelo menos uma família (criada automaticamente). Recursos compartilhados (lista de compras, marmitas) pertencem à família. |
| **Perfil** | Dados pessoais de uma pessoa. Pertence a uma família e tem uma **conta dona**. |
| **Membro** | Papel da conta na família: `owner` ou `member`. |
| **Concessão** (Fase 3) | Permissão dada pelo dono do perfil a um profissional, com escopo (ex.: só corpo e treino), validade e revogação. |
| **Dispositivo** | Cada instalação (desktop, celular, navegador) registrada para sincronização e push. |

### 4.2 Regras de autorização

- **Dados de um perfil só são acessíveis pela conta dona** e por
  concessões ativas. Estar na mesma família **não** dá acesso a peso,
  medidas, fotos ou ciclo (README §30.2).
- Toda requisição resolve o **ator** (conta + dispositivo) e o conjunto
  de perfis permitidos. Os repositórios exigem esse escopo; não existe
  consulta de dados pessoais sem `profile_id` autorizado.
- Testes de isolamento entre contas e famílias são obrigatórios para
  cada endpoint.
- Defesa adicional com **Row Level Security** do PostgreSQL avaliada
  antes da Fase 3.

## 5. Convenções da API

| Tema | Convenção |
|---|---|
| Estilo | REST + JSON, versão na URL: `/v1/...` |
| Recursos | Aninhados no perfil: `/v1/profiles/{profileId}/weights` |
| Nomes | Caminhos em `kebab-case`; campos JSON em `camelCase` |
| Datas | Data local `YYYY-MM-DD`; instantes ISO 8601 UTC (README §6.2) |
| IDs | UUID v7 gerados pelo cliente ou pelo servidor |
| Paginação | Por cursor (`?limit=50&cursor=…`), aproveitando a ordenação do UUID v7 |
| Filtros | Intervalos de data: `?from=2026-10-01&to=2026-10-31` |
| Idempotência | Header `Idempotency-Key` em todo `POST` que cria dados; obrigatório para a fila offline e webhooks |
| Concorrência | `updatedAt`/versão no corpo; conflito retorna `409` com o estado atual |
| Erros | ProblemDetails (RFC 9457) com `code` estável (ex.: `weight.out_of_range`), igual ao IPC do desktop |
| Limites | Rate limiting por IP e por conta; `429` com `Retry-After` |
| Saúde | `GET /health/live` e `GET /health/ready` |
| Documentação | OpenAPI a partir dos schemas zod |

Mudanças incompatíveis exigem nova versão (`/v2`). A versão anterior
permanece por pelo menos 6 meses, porque apps nas lojas demoram a
atualizar.

## 6. Autenticação e conta

| Tema | Plano |
|---|---|
| Métodos | E-mail e senha (com verificação de e-mail), Google, **Sign in with Apple** |
| Regra da Apple | Se o app iOS oferecer login social (Google), deve oferecer também Sign in with Apple |
| Web | Sessão em cookie `httpOnly`, `Secure`, `SameSite=Lax`, com proteção CSRF |
| Mobile e desktop | Token de acesso curto + *refresh token* rotativo, guardados em armazenamento seguro |
| 2FA | Opcional (TOTP) na Fase 2; recomendado para profissionais na Fase 3 |
| Senha | Hash forte (padrão do Better Auth), proteção contra força bruta, redefinição por e-mail |
| Sessões | Lista de dispositivos conectados, com opção de encerrar cada um |
| Exclusão de conta | Disponível no app (exigência da App Store e da LGPD): confirmação, período de carência de 30 dias, exportação oferecida antes, exclusão definitiva por tarefa agendada |

## 7. Sincronização

A sincronização atende o **desktop** e o **app mobile**, que guardam
dados localmente em SQLite.

### 7.1 Pré-requisitos (já atendidos pelo desktop)

- IDs UUID v7 gerados no cliente (sem conflito entre dispositivos).
- `created_at`, `updated_at` e `deleted_at` (soft delete) em todas as
  tabelas sincronizáveis.
- Tabelas de histórico somente com inserção (`tracking_configs`,
  `profile_questionnaires`, `nutrition_targets`, `cardio_targets`).

Na Fase 2, uma migration do desktop adiciona `server_version` e
`sync_state` às tabelas sincronizáveis.

### 7.2 Conexão de perfis

- Um perfil local passa a sincronizar quando o dono **entra com sua
  conta** e conecta aquele perfil.
- No computador compartilhado, cada perfil é conectado à conta da sua
  dona ou dono; perfis não conectados continuam apenas locais.
- Na primeira conexão, o dispositivo envia o perfil completo (como na
  transferência de perfil, README §14.4) e depois só as alterações.

### 7.3 Protocolo

```text
Cliente                                   Servidor
  │  POST /v1/sync/push                      │
  │  { deviceId, changes: [                  │
  │     { table, id, op, data, baseVersion } │
  │  ] }  + Idempotency-Key ───────────────▶ │  aplica em transação,
  │                                          │  atribui server_version
  │ ◀─────────── { accepted, conflicts } ─── │
  │                                          │
  │  GET /v1/sync/pull?cursor=…  ──────────▶ │  alterações com
  │ ◀──────────── { changes, nextCursor } ── │  server_version > cursor
```

- `server_version` é uma sequência global e crescente atribuída pelo
  servidor. O cursor do cliente é a última versão recebida.
- Envio e recebimento em lotes (ex.: 500 alterações), retomáveis.
- Exclusões trafegam como `deleted_at` (tombstones), nunca como remoção
  física.

### 7.4 Conflitos

| Tipo de dado | Política |
|---|---|
| Registros novos (pesagens, medidas, refeições) | Sem conflito: cada um tem seu UUID |
| Tabelas de histórico | Sem conflito: somente inserção |
| Edição de um registro existente | Aceita se `baseVersion` for a versão atual. Se o registro mudou no servidor desde então, o servidor aplica **a última alteração recebida** e registra o conflito |
| Exclusão vs. edição | A exclusão vence; a edição descartada fica registrada |
| Configurações do perfil | Última alteração recebida vence |

Conflitos registrados aparecem ao usuário apenas quando afetam dados
visíveis (ex.: "Esta pesagem foi editada em outro dispositivo").

### 7.5 Testes

Simulações com vários dispositivos (offline, edições cruzadas,
reconexão, lotes interrompidos) fazem parte da suíte de integração.

## 8. Dados

| Tema | Plano |
|---|---|
| Esquema | Espelha o do desktop (README §8.3) com `uuid`, `timestamptz` e `date` nativos |
| Decimais | `numeric` com escala fixa (peso `numeric(5,2)`, medidas `numeric(4,1)`) |
| Escopo | Toda tabela pessoal com `profile_id`; tabelas da família com `household_id` |
| Índices | `(profile_id, data)`, `(profile_id, server_version)` para sincronização |
| Migrations | Kysely, versionadas, executadas como etapa do deploy; padrão *expand/contract* para não derrubar versões antigas dos apps |
| Backups | PITR (recuperação para qualquer momento) do provedor; teste de restauração a cada trimestre |
| Retenção | Dados excluídos definitivamente após o período de carência; logs com retenção limitada (§11) |

## 9. Arquivos

- Fotos e documentos em armazenamento compatível com S3, nunca no banco.
- Upload e download por **URLs assinadas de curta duração**; o arquivo
  nunca é público.
- Chaves organizadas por perfil (`profiles/{profileId}/photos/{id}`).
- **Metadados de localização (EXIF/GPS) removidos** de fotos ao receber.
- Criptografia em repouso do provedor; arquivos apagados junto com o
  perfil ou a conta.

## 10. Tarefas em segundo plano

| Tarefa | Exemplo |
|---|---|
| Lembretes | Agendar e enviar push/e-mail conforme preferências (Evully Reminders) |
| E-mails | Verificação, redefinição de senha, resumo semanal |
| Exportações | Gerar o pacote de dados da conta (LGPD) |
| Exclusões | Concluir exclusão de conta após a carência |
| Webhooks | Processar pagamentos e lojas de forma idempotente |
| Outbox | Eventos internos gravados na mesma transação e processados depois (ex.: assinatura alterada → atualizar entitlements) |

Implementadas com **pg-boss**: filas e agendamentos no próprio
PostgreSQL, com novas tentativas e fila de falhas.

## 11. Observabilidade

- Logs estruturados (pino) **sem dados pessoais ou de saúde**: apenas
  IDs técnicos, códigos de erro e tempos.
- Rastreamento (OpenTelemetry) das requisições e tarefas.
- Alertas: taxa de erro, latência p95, fila acumulada, falhas de
  webhook, falhas de backup.
- **Trilha de auditoria** em tabela própria: login, alterações de
  conta, concessões, acesso de profissionais, exportações e exclusões.

## 12. Ambientes e deploy

| Ambiente | Uso |
|---|---|
| Local | Docker Compose: PostgreSQL, armazenamento S3 local (MinIO) e caixa de e-mail de teste (Mailpit) |
| Homologação | Cópia da produção sem dados reais; usada pelos builds de teste dos apps |
| Produção | Região São Paulo |

- Configuração por variáveis de ambiente **validadas com zod** na
  inicialização; segredos em cofre do provedor, nunca no repositório.
- Imagem Docker única; API **sem estado**, escalável horizontalmente.
- Pipeline: lint → typecheck → testes → build da imagem → migrations →
  deploy gradual → verificação de saúde.
- Metas iniciais: disponibilidade de 99,5%, latência p95 abaixo de
  300 ms, perda máxima de dados de 5 minutos (PITR), recuperação em até
  4 horas.

## 13. Testes

| Nível | Ferramenta | Cobertura |
|---|---|---|
| Domínio | Vitest (`packages/domain`) | Regras de negócio (já existentes desde a V0.1) |
| Casos de uso | Vitest com implementações falsas dos ports | Fluxos de cada módulo |
| Integração | Testcontainers (PostgreSQL real) + supertest | Endpoints, autorização, isolamento, migrations |
| Sincronização | Simulação de múltiplos dispositivos | §7.5 |
| Contratos | Validação das respostas contra `packages/contracts` | Clientes e API nunca divergem |
| Carga | k6 | Antes do lançamento e de campanhas |

## 14. Segurança e LGPD

O [SECURITY.md](SECURITY.md) será ampliado antes da Fase 2. Pontos já
definidos:

- HTTPS obrigatório, CORS restrito aos domínios do Evully, cabeçalhos de
  segurança, rate limiting e proteção contra força bruta.
- Proteção contra as falhas do OWASP Top 10 e OWASP API Security Top 10.
- **Direitos do titular**: exportação de dados (JSON/CSV), correção,
  exclusão de conta e revogação de consentimentos, todos disponíveis no
  app.
- Registro de consentimentos (`consent_records`) para termos, IA,
  integrações de saúde e comunicações.
- Dados sensíveis (saúde, ciclo, exames) com acesso auditado e nunca
  enviados a terceiros sem consentimento explícito.
- Encarregado de dados (DPO) e plano de resposta a incidentes antes do
  lançamento comercial.

## 15. Ordem de entrega

| Versão | Entrega |
|---|---|
| V2.0 | `accounts`, `auth`, `tracking`, `body`, `sync`, `privacy`, `notifications` (e-mail); app web e site |
| V2.x | Módulos de nutrição, treino, cardio, hábitos e sono; push; `coach` |
| V3.0 | `billing` com lojas (RevenueCat) e web; suporte ao app mobile |
| V3.x | `professionals`, `admin`, Row Level Security, recursos avançados |

## 16. Questões em aberto

| Questão | Quando |
|---|---|
| Confirmar Better Auth (ou alternativa gerenciada) | Início da Fase 2 |
| Provedores: hospedagem, PostgreSQL, armazenamento, e-mail | Início da Fase 2 |
| Provedor de pagamento web (Stripe, Asaas ou Mercado Pago) | Antes da V3.0 |
| Row Level Security no PostgreSQL | Antes da Fase 3 |
| Política de conflitos por campo (em vez de por registro) | Se os conflitos forem frequentes no uso real |
