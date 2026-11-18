import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ChoiceCard,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  NativeSelect,
  ProgressBar,
  ScreenHeader,
  Skeleton,
  StatCard,
  Switch,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TrendIndicator,
} from '@evully/ui';
import {
  Activity,
  Apple,
  ChartLine,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Moon,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Settings,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { LogoMark } from '../shell/logo';

/*
 * Internal component catalog (DESIGN.md §8): every token and component in its
 * states, in both themes. Only reachable in development builds; the desktop
 * app does not ship it. Sample texts are illustrative, never real data.
 */

const COLORS = [
  'background',
  'surface',
  'surface-muted',
  'border',
  'text',
  'text-muted',
  'brand',
  'brand-foreground',
  'brand-soft',
  'brand-soft-foreground',
  'positive',
  'positive-soft',
  'caution',
  'caution-soft',
  'neutral',
  'neutral-soft',
  'danger',
  'danger-soft',
];

const TYPE_SCALE = [
  ['text-display', 'display · 36/44', '89,8 kg'],
  ['text-title', 'title · 24/32', 'Título de tela'],
  ['text-heading', 'heading · 18/26', 'Título de seção ou cartão'],
  ['text-body', 'body · 15/22', 'Texto padrão, para leitura confortável.'],
  ['text-caption', 'caption · 13/18', 'Rótulos e textos de apoio'],
] as const;

const ICONS = [
  ['Dashboard', LayoutDashboard],
  ['Peso', Scale],
  ['Medidas', Ruler],
  ['Nutrição', Apple],
  ['Treinos', Dumbbell],
  ['Cardio', Activity],
  ['Hábitos', ListChecks],
  ['Sono', Moon],
  ['Progresso', ChartLine],
  ['Configurações', Settings],
] as const;

type Theme = 'system' | 'light' | 'dark';

/** Forces a theme while the catalog is open and restores the app's on exit. */
function useCatalogTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset['theme'];
    if (theme === 'system') delete root.dataset['theme'];
    else root.dataset['theme'] = theme;
    return () => {
      if (previous === undefined) delete root.dataset['theme'];
      else root.dataset['theme'] = previous;
    };
  }, [theme]);
}

export function CatalogScreen() {
  const [theme, setTheme] = useState<Theme>('system');
  useCatalogTheme(theme);

  return (
    <main className="mx-auto flex max-w-content flex-col gap-8 bg-background px-8 py-8 text-text">
      <ScreenHeader
        title="Catálogo de componentes"
        description="Tokens e componentes do Evully em todos os estados. Só existe em desenvolvimento."
        actions={
          <>
            <div
              role="group"
              aria-label="Tema"
              className="flex gap-1 rounded-md bg-surface-muted p-1"
            >
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={theme === t}
                  onClick={() => setTheme(t)}
                  className={
                    theme === t
                      ? 'min-h-8 rounded-sm bg-surface px-3 text-caption font-semibold shadow-sm'
                      : 'min-h-8 rounded-sm px-3 text-caption font-semibold text-text-muted'
                  }
                >
                  {{ system: 'Sistema', light: 'Claro', dark: 'Escuro' }[t]}
                </button>
              ))}
            </div>
            <Button asChild variant="secondary">
              <Link to="/profiles">Voltar ao app</Link>
            </Button>
          </>
        }
      />
      <TokensSection />
      <ButtonsSection />
      <FormsSection />
      <StatusSection />
      <DataSection />
      <OverlaysSection />
      <EvullySection />
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-heading">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function TokensSection() {
  return (
    <Section title="Tokens">
      <Card>
        <Row label="Cores semânticas">
          {COLORS.map((name) => (
            <span key={name} className="flex w-36 flex-col gap-1.5">
              <span
                className="h-12 rounded-md border border-border"
                style={{ background: `var(--evully-${name})` }}
              />
              <code className="text-caption">{name}</code>
            </span>
          ))}
        </Row>
        <Row label="Tipografia (Inter, algarismos tabulares nos números)">
          <div className="flex w-full flex-col gap-3">
            {TYPE_SCALE.map(([cls, label, sample]) => (
              <div key={cls} className="flex flex-wrap items-baseline gap-4">
                <code className="w-40 text-caption text-text-muted">{label}</code>
                <span className={`${cls} tabular-nums`}>{sample}</span>
              </div>
            ))}
          </div>
        </Row>
        <Row label="Raios">
          {(['rounded-sm', 'rounded-md', 'rounded-lg'] as const).map((r) => (
            <span
              key={r}
              className={`flex size-20 items-center justify-center border border-border bg-surface-muted text-caption ${r}`}
            >
              {r.replace('rounded-', '')}
            </span>
          ))}
        </Row>
        <Row label="Elevação (no escuro, sm e card não têm sombra)">
          {(['shadow-sm', 'shadow-card', 'shadow-md', 'shadow-lg'] as const).map((s) => (
            <span
              key={s}
              className={`flex h-16 w-28 items-center justify-center rounded-md bg-surface text-caption ${s}`}
            >
              {s.replace('shadow-', '')}
            </span>
          ))}
        </Row>
        <Row label="Ícones (Lucide, 20 px)">
          {ICONS.map(([name, Icon]) => (
            <span key={name} className="flex w-24 flex-col items-center gap-1.5 text-caption">
              <Icon aria-hidden="true" className="size-5" />
              {name}
            </span>
          ))}
        </Row>
      </Card>
    </Section>
  );
}

function ButtonsSection() {
  return (
    <Section title="Botões">
      <Card>
        {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
          <Row key={variant} label={variant}>
            <Button variant={variant}>Salvar</Button>
            <Button variant={variant}>
              <Plus aria-hidden="true" className="size-4" />
              Com ícone
            </Button>
            <Button variant={variant} busy>
              Salvando
            </Button>
            <Button variant={variant} disabled>
              Desabilitado
            </Button>
          </Row>
        ))}
        <Row label="Só ícone (com tooltip)">
          <IconButton label="Editar" onClick={() => undefined}>
            <Pencil aria-hidden="true" className="size-4.5" />
          </IconButton>
          <IconButton label="Excluir" onClick={() => undefined}>
            <Trash2 aria-hidden="true" className="size-4.5" />
          </IconButton>
          <IconButton label="Desabilitado" disabled onClick={() => undefined}>
            <Trash2 aria-hidden="true" className="size-4.5" />
          </IconButton>
        </Row>
      </Card>
    </Section>
  );
}

function FormsSection() {
  return (
    <Section title="Formulários">
      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="cat-default" label="Peso (kg)">
            <Input id="cat-default" inputMode="decimal" placeholder="Ex.: 80,4" />
          </Field>
          <Field id="cat-hint" label="Observação" hint="opcional">
            <Input id="cat-hint" />
          </Field>
          <Field id="cat-error" label="Data" error="Informe uma data válida.">
            <Input
              id="cat-error"
              aria-invalid
              aria-describedby="cat-error-error"
              defaultValue="31/02"
            />
          </Field>
          <Field id="cat-disabled" label="Desabilitado">
            <Input id="cat-disabled" disabled defaultValue="Sem edição" />
          </Field>
          <Field id="cat-select" label="Unidade">
            <NativeSelect id="cat-select" defaultValue="kg">
              <option value="kg">kg</option>
              <option value="cm">cm</option>
            </NativeSelect>
          </Field>
        </div>
        <Row label="Checkbox e Switch">
          <label htmlFor="cat-toggle-1" className="flex items-center gap-2">
            <Checkbox id="cat-toggle-1" /> Desmarcado
          </label>
          <label htmlFor="cat-toggle-2" className="flex items-center gap-2">
            <Checkbox id="cat-toggle-2" defaultChecked /> Marcado
          </label>
          <label htmlFor="cat-toggle-3" className="flex items-center gap-2 text-text-muted">
            <Checkbox id="cat-toggle-3" disabled /> Desabilitado
          </label>
          <label htmlFor="cat-toggle-4" className="flex items-center gap-2">
            <Switch id="cat-toggle-4" /> Desligado
          </label>
          <label htmlFor="cat-toggle-5" className="flex items-center gap-2">
            <Switch id="cat-toggle-5" defaultChecked /> Ligado
          </label>
          <label htmlFor="cat-toggle-6" className="flex items-center gap-2 text-text-muted">
            <Switch id="cat-toggle-6" disabled /> Desabilitado
          </label>
        </Row>
        <Row label="Escolha (questionário)">
          <ChoiceCard
            checked
            title="Perder gordura"
            description="Selecionado"
            onClick={() => undefined}
          />
          <ChoiceCard
            checked={false}
            title="Ganhar massa"
            description="Não selecionado"
            onClick={() => undefined}
          />
        </Row>
      </Card>
    </Section>
  );
}

function StatusSection() {
  return (
    <Section title="Status e avisos">
      <Card>
        <Row label="Badge">
          {(['brand', 'positive', 'caution', 'neutral', 'danger'] as const).map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
          <Badge tone="caution" size="sm">
            pequeno
          </Badge>
        </Row>
        <Row label="TrendIndicator (cor pela direção do objetivo; sempre com seta e valor)">
          <TrendIndicator tone="positive">↓ 1,2 kg</TrendIndicator>
          <TrendIndicator tone="caution">↑ 0,8 kg</TrendIndicator>
          <TrendIndicator tone="neutral">Estável</TrendIndicator>
        </Row>
        <div className="flex flex-col gap-3">
          <Alert tone="info" title="Informação" actions={<Button variant="ghost">Depois</Button>}>
            Um aviso neutro, como uma atualização pronta.
          </Alert>
          <Alert tone="success" title="Tudo certo">
            Uma confirmação de que algo deu certo.
          </Alert>
          <Alert tone="caution" title="Atenção">
            Algo pede cuidado, como um backup que falhou.
          </Alert>
          <Alert
            tone="danger"
            title="Erro"
            actions={<Button variant="secondary">Tentar de novo</Button>}
          >
            Não foi possível carregar os dados.
          </Alert>
        </div>
        <Row label="Progresso">
          <div className="w-64">
            <ProgressBar value={18} max={63} label="Progresso do projeto" />
          </div>
        </Row>
        <Row label="Carregando (Skeleton)">
          <div className="flex w-full max-w-sm flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-10" />
          </div>
        </Row>
      </Card>
    </Section>
  );
}

function DataSection() {
  return (
    <Section title="Dados">
      <Card>
        <Tabs defaultValue="a" className="flex flex-col gap-4">
          <TabsList aria-label="Exemplo de abas">
            <TabsTrigger value="a">Primeira</TabsTrigger>
            <TabsTrigger value="b">Segunda</TabsTrigger>
          </TabsList>
          <TabsContent value="a">
            <Table className="min-w-[480px]">
              <thead>
                <tr>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Valor</TableHeader>
                  <TableHeader>Status</TableHeader>
                </tr>
              </thead>
              <tbody>
                <TableRow>
                  <TableCell>02/01/2026</TableCell>
                  <TableCell className="font-semibold">80,4 kg</TableCell>
                  <TableCell>
                    <Badge tone="positive" size="sm">
                      Pronta
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>03/01/2026</TableCell>
                  <TableCell className="font-semibold">—</TableCell>
                  <TableCell>
                    <Badge tone="caution" size="sm">
                      Data inválida
                    </Badge>
                  </TableCell>
                </TableRow>
              </tbody>
            </Table>
          </TabsContent>
          <TabsContent value="b">
            <EmptyState action={<Button variant="secondary">Registrar</Button>}>
              Ainda não há registros. Eles aparecem aqui assim que você registrar.
            </EmptyState>
          </TabsContent>
        </Tabs>
      </Card>
    </Section>
  );
}

function OverlaysSection() {
  const [open, setOpen] = useState(false);
  return (
    <Section title="Diálogo">
      <Card>
        <Row label="Confirmação destrutiva">
          <Button variant="danger" onClick={() => setOpen(true)}>
            Excluir registro
          </Button>
        </Row>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Excluir registro?"
          description="Ele sai do histórico e dos gráficos."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          destructive
          onConfirm={() => setOpen(false)}
        />
      </Card>
    </Section>
  );
}

function EvullySection() {
  return (
    <Section title="Componentes Evully">
      <div className="grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <StatCard
          label="Tendência"
          value="80,4 kg"
          badge={<TrendIndicator tone="positive">↓ 1,2 kg</TrendIndicator>}
          footnote="Média de 7 dias."
        />
        <StatCard label="Cintura" value="Dados insuficientes" footnote="Registre em Medidas." />
      </div>
      <Card>
        <Row label="Avatar (só a inicial, nunca dados pessoais)">
          <Avatar initial="A" />
          <Avatar initial="B" size="lg" />
        </Row>
        <Row label="Marca">
          <LogoMark className="size-4" />
          <LogoMark className="size-8" />
          <LogoMark className="size-16" />
        </Row>
      </Card>
    </Section>
  );
}
