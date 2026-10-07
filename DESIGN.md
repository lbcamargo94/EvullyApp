# Design do Evully

Identidade visual, design system e regras de interface para todas as
plataformas: desktop (Electron), app web (React + Vite, PWA), site
(Next.js) e apps Android/iOS (React Native com Expo). O planejamento
dessas interfaces está em [FRONTEND.md](FRONTEND.md). Complementa a especificação no [README](README.md).

## 1. Identidade

| Decisão | Escolha | Motivo |
|---|---|---|
| Estilo | **Calmo e acolhedor**, com números muito legíveis | O produto valoriza tendência, não o número do dia; sem cobrança nem culpa. |
| Cor da marca | **Índigo suave** | Não se confunde com as cores de significado (verde, âmbar, cinza), é neutra para qualquer perfil e tem bom contraste nos dois temas. |
| Fonte | **Inter**, embutida no app (licença OFL) | Algarismos tabulares, boa leitura em todos os tamanhos, funciona offline. |
| Tema | **Segue o tema do sistema**; pode ser fixado em claro ou escuro | Uso rápido de manhã e à noite. |
| Ícones | **Lucide** (licença ISC) | Traço consistente, combina com o shadcn/ui. |
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

- `packages/tokens`: tokens em JSON (fonte única), exportados como
  variáveis CSS para o `@theme` do Tailwind 4 e como preset para o
  NativeWind no React Native.
- `packages/ui`: componentes base (gerados pelo CLI do shadcn/ui) e
  componentes Evully.
- **Tokens são a única fonte de cor, fonte, espaçamento e raio.** Nenhum
  componente ou tela usa cor literal (`#…`, `text-indigo-600`); usa o
  token semântico (`text-brand`, `bg-surface`).
- O tema escuro redefine apenas os tokens semânticos.

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
| `positive` | Variação favorável (§7.6 do README) | `#1A7A4A` | `#4CC38A` |
| `caution` | Variação contrária (nunca vermelho) | `#9A5B00` | `#F0B54A` |
| `neutral` | Variação neutra ou estável | `#6B7190` | `#A1A1A1` |
| `danger` | Somente ações destrutivas (apagar perfil) | `#C2413B` | `#F07A74` |
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
  para texto grande e ícones), verificado na prévia.

### 3.2 Tipografia

| Token | Tamanho / altura de linha | Uso |
|---|---|---|
| `display` | 36 / 44, peso 600 | Número principal do painel |
| `title` | 24 / 32, peso 600 | Título de tela |
| `heading` | 18 / 26, peso 600 | Título de seção e de cartão |
| `body` | 15 / 22, peso 400 | Texto padrão |
| `caption` | 13 / 18, peso 400 | Rótulos e textos auxiliares |

- Números usam `font-variant-numeric: tabular-nums` para alinhar casas
  decimais em listas e tabelas.
- Formatação sempre com `Intl` em `pt-BR` (`89,8 kg`, `06/12/2026`).

### 3.3 Espaçamento, raios e sombras

- Espaçamento em múltiplos de 4 px (escala padrão do Tailwind).
- Raios: `sm` 6 px (campos), `md` 10 px (botões), `lg` 16 px (cartões).
- Sombras discretas, apenas para elevar cartões e diálogos; no tema
  escuro a elevação usa `surface` mais claro em vez de sombra.

## 4. Componentes Evully

| Componente | Função |
|---|---|
| `StatCard` | Indicador do painel: rótulo, valor principal, variação e "dados insuficientes". |
| `TrendIndicator` | Seta + valor com sinal + cor pela direção (`positive`/`caution`/`neutral`). Nunca só cor. |
| `WeightChart` | Peso do dia, média de 7 dias e marcadores de etiquetas. |
| `MeasurementChart` | Uma medida ao longo do tempo, com seletor. |
| `MeasurementField` | Campo em cm com dica "como medir". |
| `ProfileAvatar` | Avatar e nome; nunca exibe dados pessoais. |
| `QuestionnaireStep` | Passo do questionário com progresso, voltar e pular. |
| `EmptyState` | Tela ou seção vazia com explicação e ação principal. |
| `ImportPreview` | Pré-visualização de CSV com linhas válidas, erros e duplicadas. |

Cada componente define seus estados: **padrão, carregando, vazio, erro e
dados insuficientes**, quando aplicáveis.

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

## 6. Feedback, movimento e acessibilidade

- **Toasts** (Sonner) para confirmar ações ("Peso registrado").
- **Mensagens na própria tela** para erros de carregamento, com ação de
  tentar novamente.
- **Confirmação em diálogo** para ações destrutivas, com o botão
  destrutivo em `danger`.
- Movimento mínimo (transições de até 200 ms) e respeito a
  `prefers-reduced-motion`.
- Foco sempre visível, navegação completa por teclado, rótulos em todos
  os campos e textos alternativos em ícones sem texto.

## 7. Gráficos

- Recharts, com cores vindas dos tokens nos dois temas.
- Peso do dia em pontos discretos (`neutral`); média de 7 dias em linha
  contínua (`brand`). A tendência é o elemento de maior destaque.
- Eixos com formatação `pt-BR`, grade suave e tooltip com data e valor.
- Sem gradientes ou efeitos que dificultem a leitura.

## 8. Catálogo de componentes

Em vez do Storybook, `apps/desktop` tem uma página interna de
desenvolvimento ("catálogo"), disponível apenas em modo de
desenvolvimento, que mostra cada componente em todos os estados e nos
dois temas. Ela serve para revisão visual e para testes manuais de
acessibilidade.
