# Frontend do Evully — site, app web e apps Android/iOS

Planejamento das interfaces do Evully fora do desktop. Complementa o
[README](README.md) (§29 e §30), a [arquitetura](ARCHITECTURE.md) e o
[design system](DESIGN.md).

> Nada deste documento é implementado na Fase 1, exceto a preparação
> descrita na §3.4 (`packages/app-core` e `packages/app-web`).

## 1. Produtos e fases

| Produto | O que é | Fase | Tecnologia |
|---|---|---|---|
| Desktop | Já planejado | 1 | Electron (`apps/desktop`) |
| **Site** | Páginas públicas: apresentação, funcionalidades, planos, download do desktop, termos, privacidade, ajuda | 2 | **Next.js** (`apps/site`) |
| **App web (PWA)** | Área logada no navegador, instalável no celular pela tela inicial | 2 | **React + Vite**, aplicação de página única (`apps/web`) |
| **Apps Android e iOS** | Apps nativos nas lojas | 3 | **React Native com Expo** (`apps/mobile`) |

## 2. Por que essa divisão

**Site separado do app.** O site precisa ser encontrado no Google e ser
renderizado no servidor (Next.js). O app é uma área logada, renderizada
no cliente, que deve funcionar offline.

**App web como aplicação de página única (React + Vite).** É a mesma base
do renderer do desktop, então as **mesmas telas** servem ao desktop e à
web (`packages/app-web`).

**React Native com Expo no celular.** Num app fitness comercial, o
celular tende a ser o canal principal (registro de manhã, lembretes,
treino na academia). React Native entrega:

- interface e gestos **nativos**, com melhor desempenho em listas e
  gráficos;
- **banco SQLite no celular** (offline de verdade, como no desktop);
- bibliotecas maduras para **Apple Health, Health Connect**, notificações
  e tarefas em segundo plano;
- **EAS Build**: compilação de iOS na nuvem, sem precisar de Mac.

O custo é ter **telas próprias para o celular**. Ele é reduzido separando
a lógica das telas (`packages/app-core`, compartilhada) da parte visual
(web e nativa).

## 3. Arquitetura do frontend

### 3.1 Pacotes

```text
apps/
  desktop/      Electron: shell que monta packages/app-web + cliente IPC
  web/          React + Vite: shell que monta packages/app-web + cliente HTTP (PWA)
  mobile/       Expo (React Native): telas nativas sobre packages/app-core
  site/         Next.js: páginas públicas
packages/
  app-core/     lógica das telas, sem visual (web, desktop e mobile)
  app-web/      telas com shadcn/ui (desktop e web)
  ui/           componentes web: shadcn/ui + componentes Evully
  ui-native/    componentes nativos: react-native-reusables + NativeWind (Fase 3)
  api-client/   cliente HTTP da API (implementa EvullyClient)
  tokens/       design tokens (CSS, JSON e preset Tailwind/NativeWind)
  contracts/    schemas zod e tipos
  domain/       regras de negócio
```

### 3.2 Lógica sem visual (`packages/app-core`)

Tudo o que uma tela **calcula, busca ou decide** fica em `app-core`, sem
importar DOM, shadcn ou React Native:

| Contém | Exemplo |
|---|---|
| Hooks de dados (TanStack Query) | `useDashboard()`, `useRegisterWeight()` |
| *View models* | `DashboardViewModel`: valores formatados, rótulos, tom da variação (`positive`/`caution`/`neutral`) |
| Fluxos e estados de tela | passos do questionário, pré-visualização do CSV |
| Formatação | `formatWeight(89.8)` → `"89,8 kg"` (`Intl` pt-BR) |
| Textos | `messages.pt-BR.ts` por feature |
| Interface de dados | `EvullyClient` |

As telas de `app-web` e de `apps/mobile` apenas **desenham** o que o
`app-core` entrega, cada uma com seus componentes.

```text
                       packages/app-core
               (hooks, view models, fluxos, textos)
                 │ usa EvullyClient           │ consumido por
     ┌───────────┼──────────────┐       ┌─────┴─────────────────┐
 IpcEvullyClient  HttpEvullyClient  MobileEvullyClient   app-web (shadcn)   apps/mobile (RN)
 (desktop,        (web, API)        (SQLite local +       desktop e web      telas nativas
  SQLite local)                      sincronização)
```

### 3.3 Componentes com a mesma API nas duas plataformas

Os componentes Evully existem em `packages/ui` (web) e em
`packages/ui-native` (nativo) com **o mesmo nome e as mesmas props**
(ex.: `<StatCard label value change tone />`). Uma tela nativa e uma tela
web ficam parecidas no código, o que facilita manter as duas.

### 3.4 Preparação já na V0.1

- A lógica das telas nasce em **`packages/app-core`** e as telas em
  **`packages/app-web`**, não dentro de `apps/desktop`.
- O renderer do desktop é apenas um **shell**: monta o `app-web` com o
  `IpcEvullyClient` e cuida do que é exclusivo do Electron (diálogos de
  arquivo, backup, caminhos).
- Funcionalidades que só existem em uma plataforma ficam no shell
  daquela plataforma ou atrás de uma verificação de capacidade
  (`client.capabilities.localBackup`).
- `app-core` não pode importar DOM, `react-dom`, shadcn, Electron nem
  React Native; o lint garante isso ([ARCHITECTURE.md](ARCHITECTURE.md), §8).

### 3.5 Padrões compartilhados

| Tema | Desktop e web | Mobile (React Native) |
|---|---|---|
| Rotas | React Router (`HashRouter` no Electron, `BrowserRouter` na web) | Expo Router |
| Estado do servidor | TanStack Query (em `app-core`) | O mesmo |
| Formulários | react-hook-form + zod (`packages/contracts`) | O mesmo |
| Estilo | Tailwind CSS 4 + tokens em variáveis CSS | NativeWind + preset gerado dos mesmos tokens |
| Componentes | `packages/ui` (shadcn/ui) | `packages/ui-native` (react-native-reusables) |
| Ícones | Lucide | Lucide (versão React Native) |
| Fonte | Inter embutida | Inter via `expo-font` |
| Textos e formatação | `app-core` (`pt-BR`, `Intl`) | O mesmo |
| Erros | `{ code, message }` (IPC e API) | O mesmo |

## 4. Site (`apps/site`, Fase 2)

### 4.1 Páginas

| Página | Conteúdo |
|---|---|
| Início | Proposta de valor, telas do app, chamada para criar conta, baixar o app ou o desktop |
| Funcionalidades | Corpo, nutrição, treino, sono, hábitos, estatísticas |
| Planos e preços | Free, Pro, Couple/Family (README §30.3) |
| Download | Links das lojas e instalador do desktop com versão e hash SHA-256 |
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

- Mesmas telas do desktop (`packages/app-web`), com `HttpEvullyClient`.
- **PWA**: instalável, ícones e tela de abertura, *service worker* com
  cache do app para abrir rápido e funcionar sem internet.
- **Offline** (V2.x): leitura dos últimos dados em cache (TanStack Query
  persistido em IndexedDB) e **fila de gravações** para operações simples
  (pesagem, medidas), enviadas quando a conexão voltar. Conflitos seguem
  a regra da sincronização ([BACKEND.md](BACKEND.md), §7).
- **Sessão**: cookie `httpOnly` emitido pela API; nada de token em
  `localStorage`.
- **Notificações push** na web (V2.x, Evully Reminders): suportadas em
  Android e em iOS quando o PWA está instalado na tela inicial.
- Atualização: aviso "Nova versão disponível" com botão para recarregar.
- O PWA é o app de celular da Fase 2 e continua disponível depois que os
  apps nativos forem lançados.

## 6. Apps Android e iOS (`apps/mobile`, Fase 3)

### 6.1 Abordagem

- **Expo** (React Native) com *development builds* e *config plugins*,
  sem precisar mexer nos projetos nativos na maior parte do tempo.
- **Expo Router** para navegação, com abas inferiores (DESIGN.md §5).
- Telas nativas em `apps/mobile`, usando `packages/app-core` (lógica) e
  `packages/ui-native` (componentes).
- **Dados locais com sincronização**: SQLite no celular (`expo-sqlite`)
  com Kysely, usando o mesmo protocolo de sincronização do desktop
  ([BACKEND.md](BACKEND.md), §7). O app abre e registra sem internet. A decisão final
  entre "local com sincronização" e "online com fila" é confirmada no
  início da Fase 3.
- Convenções de cada sistema: botão voltar do Android, gestos do iOS,
  áreas seguras, teclado e retorno tátil (haptics).

### 6.2 Recursos nativos

| Recurso | Biblioteca (a confirmar na Fase 3) | Uso no Evully |
|---|---|---|
| Armazenamento seguro | `expo-secure-store` | Tokens de sessão (Keychain / Keystore) |
| Notificações locais e push | `expo-notifications` | Lembretes de pesagem, treino e refeição; resumos do servidor |
| Câmera e galeria | `expo-camera`, `expo-image-picker` | Fotos de progresso |
| Biometria | `expo-local-authentication` | Desbloqueio do perfil (PIN / Face ID / digital) |
| Apple Health | `react-native-health` | Importar peso, passos, sono (com consentimento) |
| Health Connect (Android) | `react-native-health-connect` | O mesmo no Android |
| Assinaturas | `react-native-purchases` (RevenueCat) | Planos via App Store e Play Store (README §30.6) |
| Links profundos | Expo Router | Abrir telas a partir de e-mails e notificações |
| Banco local | `expo-sqlite` + Kysely | Dados offline e sincronização |

### 6.3 Exigências das lojas

- **Exclusão de conta dentro do app** (obrigatória na App Store).
- **Assinaturas** compradas no app usam o sistema da loja (Apple/Google).
- Formulários de privacidade: *App Privacy* (Apple) e *Data safety*
  (Google), declarando dados de saúde e finalidade.
- Uso de HealthKit e Health Connect exige justificativa clara e
  consentimento; dados de saúde não são usados para publicidade.
- Política de privacidade publicada no site.
- Classificação etária e categoria **Saúde e fitness**, sem alegações
  médicas.
- Contas de desenvolvedor: Apple (anual) e Google Play (taxa única).

### 6.4 Build e publicação

- **EAS Build** compila Android e **iOS na nuvem**, sem Mac (o
  desenvolvimento é no Windows).
- **EAS Submit** envia para **TestFlight** (iOS) e **teste interno**
  (Play Store) antes da produção.
- **EAS Update** permite corrigir telas e lógica JavaScript sem nova
  versão nas lojas, respeitando as regras das lojas (mudanças nativas
  sempre exigem nova versão).
- GitHub Actions dispara os builds; versões seguem o SemVer do projeto.

## 7. Qualidade, segurança e observabilidade

| Tema | Plano |
|---|---|
| Testes de lógica | Vitest em `packages/app-core` (view models, fluxos, formatação) |
| Testes de componentes web | Vitest + Testing Library em `packages/app-web` e `packages/ui` |
| Testes de componentes nativos | Jest (`jest-expo`) + React Native Testing Library |
| E2E web e desktop | Playwright (README §18.3) |
| E2E celular | Maestro em Android e iOS (fluxos críticos) |
| Acessibilidade | WCAG AA; axe na web; rótulos de acessibilidade nativos no mobile |
| Desempenho | JavaScript inicial do app web ≤ 250 kB (gzip); Core Web Vitals no site; abertura do app mobile ≤ 2 s |
| Erros em produção | Monitoramento (ex.: Sentry) com remoção de dados pessoais e de saúde |
| Métricas de produto | Eventos de uso (ex.: PostHog) sem dados de saúde, com consentimento |
| Segurança | CSP restrita e cookies `httpOnly` na web, armazenamento seguro no celular, nada de chave de API no cliente (SECURITY.md) |

## 8. Ordem de entrega

| Versão | Entrega de frontend |
|---|---|
| V0.1 | `packages/app-core` + `packages/app-web` + `EvullyClient` + shell do desktop |
| V2.0 | API + `apps/web` (PWA) + `apps/site` + login + sincronização do desktop |
| V2.x | Offline com fila de gravações, notificações push na web |
| V3.0 | `apps/mobile` (Expo) + `packages/ui-native` na Play Store e App Store, com dados locais, sincronização e assinaturas nas lojas |
| V3.x | Apple Health / Health Connect, biometria, fotos, área para profissionais |

## 9. Questões em aberto

| Questão | Quando |
|---|---|
| Mobile local com sincronização (recomendado) ou online com fila | Início da Fase 3 |
| Bibliotecas de Apple Health / Health Connect e quais dados importar | Fase 3 |
| Plano do EAS (gratuito ou pago) conforme o volume de builds | Fase 3 |
| Ferramentas de monitoramento e métricas (Sentry, PostHog ou alternativas) | Início da Fase 2 |
| Hospedagem do site e do app web | Início da Fase 2 |
| Disponibilidade dos domínios `evully.com.br` / `evully.app` | Antes da Fase 2 (junto com o registro de marca) |
