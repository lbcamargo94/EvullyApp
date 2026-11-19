import { useImportAvailable } from '@evully/app-core';
import type { ImportKind } from '@evully/contracts';
import { Button, ScreenHeader } from '@evully/ui';
import { Link, useLocation } from 'react-router';
import { importMessages } from './messages.pt-BR';

/** Screen title with the "Importar CSV" button and the result of the last import. */
export function ImportHeader({ title, kind }: { title: string; kind: ImportKind }) {
  const available = useImportAvailable();
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  return (
    <>
      <ScreenHeader
        title={title}
        actions={
          available && (
            <Button asChild variant="secondary">
              <Link to={`/app/import/${kind}`}>{importMessages.button}</Link>
            </Button>
          )
        }
      />
      {notice && (
        <p role="status" className="text-body text-positive">
          {notice}
        </p>
      )}
    </>
  );
}
