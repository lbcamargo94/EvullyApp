# Design do Evully

Identidade visual, design system e regras de interface para todas as
plataformas: desktop (Electron), app web (React + Vite, PWA), site
(Next.js) e apps Android/iOS (React Native com Expo). O planejamento
dessas interfaces está em [FRONTEND.md](FRONTEND.md). Complementa a especificação no [README](README.md).


> A implementação visual da V1.1 segue
> [docs/design/DESIGN_IMPLEMENTATION.md](docs/design/DESIGN_IMPLEMENTATION.md);
> este documento continua sendo a fonte dos tokens e das regras.

## 1. Identidade

| Decisão | Escolha | Motivo |
|---|---|---|
| Estilo | **Calmo e acolhedor**, com números muito legíveis | O produto valoriza tendência, não o número do dia; sem cobrança nem culpa. |
| Cor da marca | **Índigo suave** | Não se confunde com as cores de significado (verde, âmbar, cinza), é neutra para qualquer perfil e tem bom contraste nos dois temas. |
| Fonte | **Inter**, embutida no app (licença OFL) | Algarismos tabulares, boa leitura em todos os tamanhos, funciona offline. |
| Tema | **Segue o tema do sistema**; pode ser fixado em claro ou escuro | Uso rápido de manhã e à noite. |
| Ícones | **Lucide** (licença ISC) | Traço consistente, combina com o shadcn/ui. |
| Marca | **Coração com pulso, folha e halter**, em quadrado arredondado `brand` (`LogoMark`, SVG próprio) | Retrata bem-estar, nutrição e treino; legível a partir de 16 px; segue o tema. O ícone do app sai de `apps/desktop/build/icon.svg` (`npm run icon -w @evully/desktop`). |
| Tom de voz | Neutro, encorajador e direto | Ex.: "Tendência de queda de 1,9 kg", nunca "Você engordou". |

Os valores de cor abaixo são o ponto de partida e serão ajustados na
prévia visual antes da V0.1.

## 2. Arquitetura do design system

```text
Tokens primitivos    paleta, escala de espaçamento, raios, sombras, fontes
      ↓
Tokens semânticos    surface, text, border, brand, positive, caution, neutral…
      ↓              (definidos para tema claro e escuro)
Componentes base     web: shadcn/ui (packages/ui)
      ↓              nativo: react-native-reusables + NativeWind (packages/ui-native)
Componentes Evully   StatCard, TrendIndicator, MeasurementField, WeightChart,
      ↓              ProfileAvatar, QuestionnaireStep, EmptyState…
      ↓              (mesmo nome e mesmas props na web e no nativo)
Telas                packages/app-web (desktop e web), apps/mobile, apps/site
```

- `packages/tokens`: tokens em `tokens.json` (fonte única). O
  `npm run build -w @evully/tokens` gera `tokens.css` (variáveis CSS para o
  `@theme` do Tailwind 4) e `nativewind-preset.cjs` (preset do NativeWind,
  `@evully/tokens/nativewind-preset`), e os testes conferem que os dois
  estão em dia.
  - O preset usa os mesmos nomes de classe da web (`bg-surface`,
    `text-heading`, `rounded-lg`, `shadow-card`).
  - Os valores dos dois temas ficam em `themes.light` e `themes.dark`; o
    app mobile aplica um deles com `vars()` na raiz.
- `packages/ui`: componentes base (gerados pelo CLI do shadcn/ui) e
  componentes Evully.
- **Tokens são a única fonte de cor, fonte, espaçamento e raio.** Nenhum
  componente ou tela usa cor literal (`#…`, `text-indigo-600`); usa o
  token semântico (`text-brand`, `bg-surface`). O `npm run lint` falha com
  cor fora dos tokens (`scripts/check-colors.mjs`).
- O tema escuro redefine apenas os tokens semânticos.
- Por padrão o tema segue o sistema (`prefers-color-scheme`). A escolha em
  Configurações — Geral fixa claro ou escuro com `data-theme` no `<html>`;
  no desktop, `nativeTheme` acompanha a escolha (barra de título e diálogos).

## 3. Tokens

### 3.1 Cores semânticas

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `background` | Fundo da janela | `#EFEFFC` | `#0A0A0A` |
| `surface` | Cartões, painéis | `#FAFAFF` | `#171717` |
| `surface-muted` | Áreas secundárias, item ativo do menu | `#E8E8FA` | `#262626` |
| `border` | Bordas e divisórias | `#DCDDF2` | `#2A2A2A` |
| `text` | Texto principal | `#161A2E` | `#FAFAFA` |
| `text-muted` | Texto secundário | `#5B6280` | `#A1A1A1` |
| `brand` | Ações principais, foco, destaque | `#5457D6` | `#8B8EF0` |
| `brand-foreground` | Texto sobre `brand` | `#FFFFFF` | `#0A0A0A` |
| `brand-soft` | Fundo de item ativo, avatar | `#E3E4FB` | `#262626` |
| `brand-soft-foreground` | Texto sobre `brand-soft` | `#3F42B8` | `#FAFAFA` |
| `positive` | Variação favorável (§7.6 do README) | `#197648` | `#4CC38A` |
| `caution` | Variação contrária (nunca vermelho) | `#975900` | `#F0B54A` |
| `neutral` | Variação neutra ou estável | `#606682` | `#A1A1A1` |
| `positive-soft`, `caution-soft`, `neutral-soft` | Fundo dos selos de variação | `#E3F1EA`, `#FBEFD9`, `#E8E8FA` | `#14281D`, `#2E2410`, `#262626` |
| `danger` | Somente ações destrutivas (apagar perfil) | `#B63D37` | `#F07A74` |
| `danger-soft` | Fundo de selos e avisos de erro, hover do botão destrutivo | `#FBE9E8` | `#2E1514` |
| `overlay` | Fundo escurecido atrás dos diálogos | `#161A2E66` | `#000000A6` |
| `focus-ring` | Anel de foco | `brand` | `brand` |

O **tema claro usa o índigo da marca em tom bem claro** no fundo e nas
superfícies, no lugar do branco puro. O **tema escuro segue a paleta neutra do shadcn/ui** (cinzas puros, sem
tom azulado); o índigo aparece só como destaque (`brand`).

Regras:

- `positive`, `caution` e `neutral` são reservados para a **direção dos
  indicadores**. Não são usados como decoração.
- `danger` nunca é usado para resultados de peso ou medidas; só para
  ações destrutivas e erros de sistema.
- Todo par texto/fundo atende **WCAG AA** (4,5:1 para texto normal, 3:1
  para texto grande, ícones e o anel de foco). Os pares em uso estão em
  `packages/tokens/scripts/check-contrast.mjs`, que roda em `npm test` nos
  dois temas; um par novo entra nesse script.

### 3.2 Tipografia

| Token | Tamanho / altura de linha | Uso |
|---|---|---|
| `display` | 36 / 44, peso 600 | Número principal do painel |
| `title` | 24 / 32, peso 600 | Título de tela |
| `heading` | 18 / 26, peso 600 | Título de seção e de cartão |
| `body` | 15 / 22, peso 400 | Texto padrão |
| `caption` | 13 / 18, peso 400 | Rótulos e textos auxiliares |

- A escala está em `packages/tokens/tokens.json` (`text`) e vira as classes
  `text-display`, `text-title`, `text-heading`, `text-body` e
  `text-caption`. Telas não usam tamanhos soltos (`text-[15px]`).
- Ao migrar telas (V1.1, fase 4): texto auxiliar em cor secundária (dica,
  metadado, rótulo) usa `caption`; texto de conteúdo, botões e links usam
  `body`; títulos de cartão usam `heading`. Rótulos em caixa alta levam
  `tracking-wider`.

- Números usam `font-variant-numeric: tabular-nums` para alinhar casas
  decimais em listas e tabelas.
- Formatação sempre com `Intl` em `pt-BR` (`89,8 kg`, `06/12/2026`).

### 3.3 Espaçamento, raios e sombras

- Espaçamento em múltiplos de 4 px (escala padrão do Tailwind).
- Raios: `sm` 6 px (campos), `md` 10 px (botões), `lg` 16 px (cartões).
- Sombras discretas, apenas para elevar cartões e diálogos; no tema
  escuro a elevação usa `surface` mais claro em vez de sombra.
- Sombras são tokens por tema (`shadow`: `sm`, `card`, `md`, `lg`); no
  escuro, `sm` e `card` são `none`.
- Larguras de layout também são tokens (`layout`): `max-w-content`
  (1200 px) para o conteúdo e `w-sidebar` (240 px) para a barra lateral.

## 4. Componentes Evully

| Componente | Função |
|---|---|
| `ScreenHeader` | Topo de cada tela: título (o único `<h1>`), descrição curta opcional e ações da tela (`packages/ui`). |
| `StatCard` | Indicador do painel: rótulo, valor principal, variação e "dados insuficientes" (`insufficient`: em tamanho de título e cor secundária, nunca em tamanho de métrica). |
| `TrendIndicator` | Seta + valor com sinal + cor pela direção (`positive`/`caution`/`neutral`). Nunca só cor. |
| `WeightChart` | Peso do dia, média de 7 dias e marcadores de etiquetas (`app-web`, `weights/weight-chart.tsx`). |
| `MeasurementChart` | Uma medida ao longo do tempo, com seletor (`app-web`, `measurements/measurement-chart.tsx`). |
| `MeasurementField` | Campo em cm com dica "como medir" (hoje dentro de `MeasurementForm`, `app-web`). |
| `ProfileAvatar` | Avatar e nome; nunca exibe dados pessoais. No código: `Avatar` (`packages/ui`), só com a inicial. |
| `QuestionnaireStep` | Passo do questionário com progresso, voltar e pular (`app-web`, `tracking/questionnaire-steps.tsx`: `StepHeading` e um componente por passo). |
| `EmptyState` | Lista, gráfico ou seção vazia: texto explicativo em borda tracejada e ação opcional (`packages/ui`). |
| `ImportPreview` | Pré-visualização de CSV com linhas válidas, erros e duplicadas (`app-web`, `ImportPreviewTable`). |

`StatCard` e `TrendIndicator` ficam em `packages/ui`.

### 4.1 Componentes base (`packages/ui`)

| Componente | Uso |
|---|---|
| `Button` | Variantes `primary`, `secondary`, `ghost` e `danger`; `busy` desabilita e mostra um indicador de carregando. |
| `IconButton` | Botão só com ícone; o rótulo é o nome acessível e aparece como `Tooltip`. |
| `Input`, `NativeSelect`, `Field` | Campo com rótulo, dica e erro ligados por `id` para leitores de tela. |
| `Checkbox`, `Switch` | `<input type="checkbox">` nativo estilizado; o `Switch` tem `role="switch"` e serve para ajustes que valem na hora. |
| `ChoiceCard` | Opção grande do questionário (rádio ou checkbox). |
| `Badge` | Rótulo curto em `brand`, `positive`, `caution`, `neutral` ou `danger`, tamanhos `sm` e `md`. |
| `Alert` | Aviso no fluxo da página (sem toast): `info` e `success` com `role="status"`, `caution` e `danger` com `role="alert"`. |
| `Table`, `TableRow`, `TableHeader`, `TableCell` | Tabela de dados dentro de um `Card`, com rolagem lateral. |
| `SegmentedControl` | Escolha curta e exclusiva, como o período: grupo nomeado de botões com `aria-pressed`. Usado em Progresso e no gráfico de peso. |
| `Tabs`, `Dialog`/`ConfirmDialog`, `DropdownMenu`, `Tooltip` | Primitivas Radix com os tokens. |
| `ProgressBar`, `Skeleton`, `EmptyState` | Progresso, carregando e vazio; `Skeleton` para de piscar com `prefers-reduced-motion`. |
| `Icon` | Ícone Lucide no tamanho e traço do Evully (§4.2). |
| `BrandTile` e ilustrações | Ilustrações no estilo do ícone do app (§4.3); `EmptyState` aceita `illustration` e `title`. |
| `useShowMore`, `ShowMoreButton` | Históricos longos: os mais recentes primeiro (30 registros; no Cardio, 8 semanas) e "Mostrar mais" para os próximos. |

Cada componente define seus estados: **padrão, carregando, vazio, erro e
dados insuficientes**, quando aplicáveis.

### 4.2 Ícones

- **Lucide**, sempre pelo componente `Icon` de `packages/ui`, com traço de
  2 px e um de três tamanhos:

  | Tamanho | px | Uso |
  |---|---|---|
  | `sm` (padrão) | 16 | Dentro de botões, linhas e selos |
  | `md` | 20 | Menu, setas de navegação, avisos |
  | `lg` | 24 | Destaque (erro de tela, adicionar perfil) |

- Um ícone sozinho é decorativo (`aria-hidden`): o nome vem do botão ou do
  texto ao lado. Ícone que carrega informação recebe `label` e vira
  `role="img"`.
- **Um ícone por módulo**, definido em `MODULES`
  (`app-web/src/features/shell/modules.ts`), usado no menu e onde o
  módulo aparecer:

  | Módulo | Ícone |
  |---|---|
  | Dashboard | `LayoutDashboard` |
  | Peso | `Scale` |
  | Medidas | `Ruler` |
  | Nutrição | `Apple` |
  | Treinos | `Dumbbell` |
  | Cardio | `Activity` |
  | Hábitos | `ListChecks` |
  | Sono | `Moon` |
  | Progresso | `ChartLine` |
  | Configurações | `Settings` |

- O `npm run lint` falha com ícone Lucide desenhado direto, sem `Icon`
  (`scripts/check-icons.mjs`).

### 4.3 Ilustrações

- **Estilo "selo da marca"**, o mesmo desenho do ícone do app: um bloco
  arredondado na cor `brand`, levemente inclinado, sobre um bloco
  `brand-soft` virado para o outro lado, com pequenos brilhos. O símbolo
  do módulo fica em `brand-foreground`; onde duas formas se cruzam, um
  contorno `brand` as separa (como o halter do logo).
- Componentes SVG em `packages/ui/src/illustrations/`: o `BrandTile` faz o
  bloco e cada ilustração desenha só o seu símbolo numa área de 88 × 88.
  Só tokens, então seguem o tema; sempre decorativas (`aria-hidden`).
- Onde aparecem:

  | Ilustração | Tela |
  |---|---|
  | `SleepIllustration` | Sono, histórico vazio |
  | `WorkoutsIllustration` | Treinos › Planos, sem planos |
  | `WeightIllustration` | Peso, histórico vazio |
  | `MeasurementsIllustration` | Medidas, histórico vazio |
  | `FavoritesIllustration` | Nutrição › Favoritas, sem favoritas |
  | `FoodsIllustration` | Nutrição › Alimentos, sem alimentos |
  | `CardioIllustration` | Cardio, histórico vazio |
  | `HabitsIllustration` | Hábitos › Dia, sem hábitos |
  | `WelcomeIllustration` | Criação de perfil |
  | `GoalIllustration` | Primeiro passo do questionário |
  | `RecoveryIllustration` | Tela de recuperação do banco |
  | `ErrorIllustration` | Tela de erro inesperado |

- Com ilustração, o `EmptyState` também recebe `title`. Gráficos sem dados
  e listas dentro de outros cartões (histórico de um exercício) ficam com a
  linha simples, sem ilustração, para a tela não ficar pesada.
- Peça nova passa por aprovação antes de entrar (README §15.3).

## 5. Layout e plataformas

| Plataforma | Navegação | Observações |
|---|---|---|
| Desktop (≥ 1024 px) | Barra lateral fixa + barra superior com o perfil atual | Conteúdo com largura máxima de 1200 px. |
| Web (≥ 1024 px) | Igual ao desktop | Mesmos componentes. |
| Celular (< 768 px) | **Barra inferior de abas** + cabeçalho compacto | Mesmos itens de menu, outro layout. Áreas de toque de no mínimo 44 px. |
| Tablet (768–1023 px) | Barra lateral recolhida (só ícones) | — |

- Componentes de `packages/ui` são **responsivos desde a V0.1**, mesmo
  que o desktop não precise de telas pequenas.
- Ações principais ficam ao alcance: no celular, o registro de peso é
  acessível com um toque a partir da tela inicial.

### 5.1 Ordem do Dashboard

Cabeçalho (saudação, data de hoje e os atalhos Registrar medidas/peso) →
indicadores (`StatCard` de peso e até 3 medidas) → gráfico de peso ao
lado do card "Hoje" (uma coluna em telas estreitas) → "Próximo treino" →
projeto → "Últimos 14 dias" → hábitos, cardio e sono. Cada bloco só
aparece para módulos em uso e com dados; enquanto o perfil carrega, um
`Skeleton` no formato dos indicadores. O gráfico segue a escolha de
exibição do peso e some quando ela é "ocultar".

## 6. Feedback, movimento e acessibilidade

- **Confirmação no próprio formulário**, com `role="status"` ("Pesagem
  registrada."), lida pelo leitor de tela; o app não usa toasts.
- **Erros de carregamento** num aviso único no topo do conteúdo
  (`QueryErrorBanner`), com "Tentar de novo"; nada é apagado. Uma tela que
  explica o próprio erro marca a consulta com `meta: { localError: true }`.
- **Confirmação em diálogo** para ações destrutivas, com o botão
  destrutivo em `danger`.
- Movimento mínimo (transições de até 200 ms) e respeito a
  `prefers-reduced-motion`.
- Foco sempre visível, navegação completa por teclado, rótulos em todos
  os campos e textos alternativos em ícones sem texto.
- Controles liga/desliga que gravam sozinhos (hábito, série concluída,
  alimento consumido, refeição, backup automático) mostram o novo estado na
  hora, não ficam desativados durante a gravação (para não perder o foco) e
  voltam ao estado gravado se ela falhar, com a mensagem de erro
  (`useSavedToggle`).
- Ao abrir outra tela (não uma aba), o foco vai para o conteúdo, para o
  leitor de tela anunciar a tela nova. "Registrar peso" e "Registrar medidas"
  no Dashboard abrem a tela com o cursor no primeiro campo (`FOCUS_FORM`),
  assim como editar um registro: pesar e registrar só com o teclado.
- Campo com dica longa (como medir) usa a dica como descrição
  (`aria-describedby`), não como parte do nome.
- "Pular para o conteúdo" é o primeiro item do teclado em todas as telas
  do perfil e leva o foco ao `<main>` (um botão, porque o desktop usa
  `HashRouter`).
- `eslint-plugin-jsx-a11y` roda no `npm run lint`. O foco automático é
  permitido só no primeiro campo de um formulário ou diálogo que o usuário
  acabou de abrir.

## 7. Gráficos

- Recharts, com cores vindas dos tokens nos dois temas.
- Peso do dia em pontos discretos (`neutral`); média de 7 dias em linha
  contínua (`brand`). A tendência é o elemento de maior destaque.
- Eixos com formatação `pt-BR` (até uma casa decimal, para valores
  próximos não repetirem o mesmo rótulo), grade suave e tooltip com data
  e valor.
- Sem gradientes ou efeitos que dificultem a leitura.
- Todo gráfico tem `role="img"` e uma descrição em texto com a quantidade
  de pontos e o primeiro e o último valor de cada série.

## 8. Catálogo de componentes

Em vez do Storybook, `apps/desktop` tem uma página interna de
desenvolvimento ("catálogo"), disponível apenas em modo de
desenvolvimento, que mostra cada componente em todos os estados e nos
dois temas. Ela serve para revisão visual e para testes manuais de
acessibilidade.

- Tela: `packages/app-web/src/features/catalog/catalog-screen.tsx`
  (export `@evully/app-web/catalog`), rota `/dev/catalog`. Em `npm run dev`
  aparece o link "Catálogo de componentes (dev)" no rodapé do menu.
- O renderer do desktop só passa o catálogo ao `App` quando
  `import.meta.env.DEV` é verdadeiro; no build de produção o import é
  removido e o catálogo não vai para o instalador.
- Mostra tokens (cores, tipografia, raios, elevação, ícones), os
  componentes base da §4.1 e os componentes Evully, com alternância
  Sistema/Claro/Escuro. Os textos de exemplo são ilustrativos.
- Componente novo em `packages/ui` entra no catálogo no mesmo PR.
