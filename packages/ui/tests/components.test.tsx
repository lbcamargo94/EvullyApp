import { Moon } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Icon,
  IconButton,
  ScreenHeader,
  ShowMoreButton,
  Skeleton,
  StatCard,
  Switch,
  Table,
  TableHeader,
  TooltipProvider,
  TrendIndicator,
  useShowMore,
} from '../src';

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('ui components (DESIGN.md §4, §6)', () => {
  it('ScreenHeader renders the only h1, the description and the actions', () => {
    const out = html(
      <ScreenHeader title="Peso" description="Pesagens" actions={<button>Ok</button>} />,
    );
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('Pesagens');
    expect(out).toContain('<button>Ok</button>');
  });

  it('Button busy is disabled, announced as busy and keeps its label', () => {
    const out = html(<Button busy>Salvar</Button>);
    expect(out).toContain('disabled=""');
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('Salvar');
  });

  it('Checkbox and Switch stay native inputs; the switch has role="switch"', () => {
    expect(html(<Checkbox aria-label="Feito" />)).toMatch(
      /<input type="checkbox"[^>]*aria-label="Feito"/,
    );
    expect(html(<Switch aria-label="Automático" />)).toMatch(/type="checkbox" role="switch"/);
  });

  it('Alert uses role="alert" for problems and role="status" otherwise', () => {
    expect(html(<Alert tone="danger" title="Erro" />)).toContain('role="alert"');
    expect(html(<Alert tone="caution" title="Atenção" />)).toContain('role="alert"');
    expect(html(<Alert tone="info" title="Novidade" />)).toContain('role="status"');
    expect(html(<Alert tone="success" title="Pronto" />)).toContain('role="status"');
  });

  it('Badge and TrendIndicator carry their text, not only color', () => {
    expect(html(<Badge tone="danger">Erro</Badge>)).toContain('Erro');
    expect(html(<TrendIndicator tone="positive">↓ 1,2 kg</TrendIndicator>)).toContain('↓ 1,2 kg');
  });

  it('IconButton has an accessible name', () => {
    const out = html(
      <TooltipProvider>
        <IconButton label="Excluir" onClick={() => undefined}>
          <svg />
        </IconButton>
      </TooltipProvider>,
    );
    expect(out).toContain('aria-label="Excluir"');
  });

  it('Skeleton is hidden from assistive technology and stops under reduced motion', () => {
    const out = html(<Skeleton />);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('motion-reduce:animate-none');
  });

  it('table headers are column headers', () => {
    const out = html(
      <Table>
        <thead>
          <tr>
            <TableHeader>Data</TableHeader>
          </tr>
        </thead>
      </Table>,
    );
    expect(out).toContain('<th scope="col"');
  });

  it('StatCard shows insufficient data as a muted heading, not at metric size', () => {
    const out = html(<StatCard label="Peso" value="Dados insuficientes" insufficient />);
    expect(out).toContain('text-heading');
    expect(out).toContain('text-text-muted');
    expect(out).not.toContain('text-display');
    expect(html(<StatCard label="Peso" value="80 kg" />)).toContain('text-display');
  });

  it('useShowMore shows the first step and counts the rest; the button hides when nothing is left', () => {
    function List({ items }: { items: number[] }) {
      const { visible, hidden, showMore } = useShowMore(items, 2);
      return (
        <>
          <ul>
            {visible.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <ShowMoreButton hidden={hidden} onClick={showMore}>
            Mais {hidden}
          </ShowMoreButton>
        </>
      );
    }
    const out = html(<List items={[1, 2, 3, 4, 5]} />);
    expect(out.match(/<li>/g)).toHaveLength(2);
    expect(out).toContain('Mais 3');
    expect(html(<List items={[1, 2]} />)).not.toContain('<button');
  });

  it('Icon is decorative by default, announced with a label, in one of three sizes', () => {
    const plain = html(<Icon icon={Moon} />);
    expect(plain).toContain('aria-hidden="true"');
    expect(plain).toContain('size-4');
    expect(plain).toContain('stroke-width="2"');
    const named = html(<Icon icon={Moon} size="lg" label="Sono" />);
    expect(named).toContain('role="img"');
    expect(named).toContain('aria-label="Sono"');
    expect(named).toContain('size-6');
  });
});
