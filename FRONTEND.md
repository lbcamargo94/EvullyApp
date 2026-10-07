# Frontend do Evully — site, app web e apps Android/iOS

Planejamento das interfaces do Evully fora do desktop. Complementa o
[README](README.md) (§29 e §30), a [arquitetura](ARCHITECTURE.md) e o
[design system](DESIGN.md).

> Nada deste documento é implementado na Fase 1, exceto a preparação
> descrita na §3.3 (telas compartilhadas em `packages/app`).

## 1. Produtos e fases

| Produto | O que é | Fase | Tecnologia |
|---|---|---|---|
| **Site** | Páginas públicas: apresentação, funcionalidades, planos, download do desktop, termos, privacidade, ajuda | 2 | **Next.js** (`apps/site`) |
| **App web (PWA)** | Área logada no navegador, instalável no celular pela tela inicial | 2 | **React + Vite**, aplicação de página única (`apps/web`) |
| **Apps Android e iOS** | O app web empacotado para a Play Store e a App Store | 3 | **Capacitor** (`apps/mobile`) |
| Desktop | Já planejado | 1 | Electron (`apps/desktop`) |

## 2. Por que o site e o app são projetos separados

| Necessidade | Site | App (web, celular, desktop) |
|---|---|---|
| Ser encontrado no Google (SEO) | Essencial | Irrelevante (área logada) |
| Renderização | Estática no servidor (SSG/ISR) | No cliente |
| Funcionar empacotado no Capacitor | Não precisa | **Obrigatório**: o Capacitor empacota arquivos estáticos, sem servidor |
| Funcionar offline | Não precisa | Desejável (registrar peso sem internet) |

- O **Next.js** é a melhor ferramenta para o site.
- O app precisa ser uma **aplicação React de página única**, para rodar
  igual no navegador, no Capacitor e no Electron. O renderer do desktop
  já é exatamente isso (React + Vite).
- Resultado: as **mesmas telas** servem ao desktop, à web e ao celular.

## 3. Arquitetura do frontend

### 3.1 Pacotes

```text
apps/
  desktop/      Electron: janela, IPC, banco local
  web/          React + Vite: PWA (navegador) — mesma build usada no mobile
  mobile/       Capacitor: projetos Android e iOS, plugins nativos
  site/         Next.js: páginas públicas
packages/
  app/          telas e fluxos compartilhados (features), rotas, estado
  api-client/   cliente HTTP da API (implementa EvullyClient)
  ui/           componentes shadcn/ui + componentes Evully
  tokens/       design tokens
  contracts/    schemas zod e tipos
  domain/       regras de negócio
```

### 3.2 Uma porta de dados, três implementações

As telas de `packages/app` não sabem de onde vêm os dados. Elas usam a
interface `EvullyClient`, definida com os tipos de `packages/contracts`:

```text
                packages/app (telas, TanStack Query)
                          │ usa
                    EvullyClient (port)
          ┌───────────────┼────────────────┐
   IPC client        HTTP client       HTTP client
 (apps/desktop)   (packages/api-client) (o mesmo, no Capacitor)
   SQLite local       API NestJS         API NestJS
```

- Desktop: `IpcEvullyClient` chama o processo main (local, offline).
- Web e celular: `HttpEvullyClient` chama a API NestJS.
- Cada app (shell) entrega a implementação ao montar o `packages/app`.

### 3.3 Preparação já na V0.1

Para não reescrever telas na Fase 2, o desktop já nasce assim:

- telas e fluxos do renderer ficam em **`packages/app`**, não em
  `apps/desktop`;
- o renderer do desktop é apenas um **shell**: monta o `packages/app`
  com o `IpcEvullyClient` e cuida do que é exclusivo do Electron
  (diálogos de arquivo, backup, caminhos);
- funcionalidades que só existem em uma plataforma ficam no shell
  daquela plataforma ou atrás de uma verificação de capacidade
  (`client.capabilities.localBackup`).

### 3.4 Padrões compartilhados

| Tema | Padrão |
|---|---|
| Rotas | React Router em todas as plataformas (`HashRouter` no Electron, `BrowserRouter` na web e no Capacitor) |
| Estado do servidor | TanStack Query; nenhum estado global para dados vindos do backend |
| Estado de interface | Estado local do React; contexto apenas para perfil atual, tema e sessão |
| Formulários | react-hook-form + zod (`packages/contracts`) |
| Textos | Centralizados por feature (`messages.pt-BR.ts`) desde a V0.1; biblioteca de i18n só quando houver segundo idioma |
| Formatação | `Intl` em `pt-BR` (§16.1 do README) |
| Layout | Responsivo (DESIGN.md §5): barra lateral ≥ 1024 px, barra de abas inferior < 768 px |
| Erros | Mesmo formato `{ code, message }` do IPC e da API (ProblemDetails) |

## 4. Site (`apps/site`, Fase 2)

### 4.1 Páginas

| Página | Conteúdo |
|---|---|
| Início | Proposta de valor, telas do app, chamada para criar conta ou baixar |
| Funcionalidades | Corpo, nutrição, treino, sono, hábitos, estatísticas |
| Planos e preços | Free, Pro, Couple/Family (README §30.3) |
| Download | Instalador do desktop com versão e hash SHA-256 |
| Para profissionais | Fase 3 (README §30.5) |
| Ajuda / FAQ | Perguntas frequentes, como restaurar backup, contato |
| Privacidade, Termos, LGPD | Política de privacidade, termos de uso, canal do encarregado de dados |
| Entrar / Criar conta | Redireciona para o app web |

### 4.2 Decisões

- Renderização estática (SSG/ISR), metadados e imagens de
  compartilhamento por página, `sitemap.xml` e `robots.txt`.
- Usa `packages/ui` e `packages/tokens`: mesma identidade do app.
- Métricas de acesso **sem cookies** (ex.: Plausible ou Umami), sem
  banner de consentimento e sem rastrear dados de saúde.
- Textos sem promessas médicas ou de resultado ("perca X kg em Y dias").
- Domínios planejados: `evully.com.br` (site), `app.evully.com.br`
  (app web), `api.evully.com.br` (API). Registrar o domínio junto com a
  marca no INPI (README §35.2).

## 5. App web e PWA (`apps/web`, Fase 2)

- Mesmas telas de `packages/app`, com `HttpEvullyClient`.
- **PWA**: instalável, ícones e tela de abertura, *service worker* com
  cache do app para abrir rápido e funcionar sem internet.
- **Offline no celular** (V2.x): leitura dos últimos dados em cache
  (TanStack Query persistido em IndexedDB) e **fila de gravações** para
  operações simples (pesagem, medidas), enviadas quando a conexão
  voltar. Conflitos seguem a regra da sincronização (README §29.3).
- **Sessão**: cookie `httpOnly` emitido pela API; nada de token em
  `localStorage`.
- **Notificações push** na web (V2.x, Evully Reminders): suportadas em
  Android e em iOS quando o PWA está instalado na tela inicial.
- Atualização: aviso "Nova versão disponível" com botão para recarregar.

## 6. Apps Android e iOS (`apps/mobile`, Fase 3)

### 6.1 Abordagem

- **Capacitor empacota a build de `apps/web`** dentro do app (não carrega
  um site remoto). O app abre offline e atende à exigência da Apple de
  não ser apenas um site embrulhado.
- Mesmas telas, com ajustes nativos: áreas seguras (notch), botão
  voltar do Android, teclado, gestos, retorno tátil (haptics).

### 6.2 Recursos nativos (plugins)

| Recurso | Uso no Evully |
|---|---|
| Armazenamento seguro | Tokens de sessão (Keychain / Keystore) |
| Notificações locais | Lembretes de pesagem, treino, refeição (Evully Reminders) |
| Notificações push | Resumos e lembretes do servidor (APNs / FCM) |
| Câmera e galeria | Fotos de progresso |
| Biometria | Desbloqueio do perfil (PIN / Face ID / digital) |
| Apple Health e Health Connect | Importar peso, passos, sono (a avaliar; exige justificativa e consentimento) |
| Compras no app | Assinaturas via **RevenueCat** (README §30.6) |
| Links profundos | Abrir telas a partir de e-mails e notificações |

### 6.3 Exigências das lojas

- **Exclusão de conta dentro do app** (obrigatória na App Store).
- **Assinaturas** compradas no app usam o sistema da loja (Apple/Google).
- Formulários de privacidade: *App Privacy* (Apple) e *Data safety*
  (Google), declarando dados de saúde e finalidade.
- Política de privacidade publicada no site.
- Classificação etária e categoria **Saúde e fitness**, sem alegações
  médicas.
- Contas de desenvolvedor: Apple (anual) e Google Play (taxa única).

### 6.4 Build e publicação

- **iOS exige macOS para compilar.** Como o desenvolvimento é no Windows,
  as builds iOS rodam em runners macOS do GitHub Actions (ou serviço de
  build na nuvem).
- Pipeline: GitHub Actions + fastlane, publicando em **TestFlight**
  (iOS) e **teste interno** (Play Store) antes da produção.
- Atualizações de telas sem nova versão nas lojas (*live updates*) podem
  ser avaliadas depois, respeitando as regras das lojas.

## 7. Qualidade, segurança e observabilidade

| Tema | Plano |
|---|---|
| Testes de componentes | Vitest + Testing Library em `packages/app` e `packages/ui` |
| E2E web | Playwright (mesmos fluxos do desktop, README §18.3) |
| E2E celular | Maestro em Android e iOS (fluxos críticos) |
| Acessibilidade | WCAG AA; verificação automática com axe nos testes |
| Desempenho | Orçamento de JavaScript inicial do app web ≤ 250 kB (gzip); Core Web Vitals no site |
| Erros em produção | Monitoramento (ex.: Sentry) com remoção de dados pessoais e de saúde |
| Métricas de produto | Eventos de uso (ex.: PostHog) sem dados de saúde, com consentimento |
| Segurança | CSP restrita, cookies `httpOnly` na web, armazenamento seguro no celular, nada de chave de API no cliente (SECURITY.md) |

## 8. Ordem de entrega

| Versão | Entrega de frontend |
|---|---|
| V0.1 | Telas em `packages/app` + `EvullyClient` + shell do desktop |
| V2.0 | API + `apps/web` (PWA) + `apps/site` + login + sincronização do desktop |
| V2.x | Offline com fila de gravações, notificações push na web |
| V3.0 | `apps/mobile` (Capacitor) na Play Store e App Store, assinaturas nas lojas |
| V3.x | Recursos nativos: Health, biometria, fotos, área para profissionais |

## 9. Questões em aberto

| Questão | Quando |
|---|---|
| Integração com Apple Health / Health Connect: quais dados e com qual plugin | Fase 3 |
| Ferramentas de monitoramento e métricas (Sentry, PostHog ou alternativas) | Início da Fase 2 |
| Hospedagem do site e do app web | Início da Fase 2 |
| Live updates no Capacitor | Após a primeira versão nas lojas |
| Disponibilidade dos domínios `evully.com.br` / `evully.app` | Antes da Fase 2 (junto com o registro de marca) |
