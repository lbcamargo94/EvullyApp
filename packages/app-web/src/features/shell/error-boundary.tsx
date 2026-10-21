import { Button, Card } from '@evully/ui';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { shellMessages as m } from './messages.pt-BR';

/**
 * Last line of defense for rendering errors (README §8.10, criterion 14): a
 * calm message and a way out instead of a blank window. Error details are not
 * shown; the data is safe in the database.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: unknown, info: ErrorInfo) => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-text">
        <Card role="alert" className="w-full max-w-md gap-4 p-8">
          <h1 className="text-xl font-semibold">{m.errorTitle}</h1>
          <p className="text-text-muted">{m.errorBody}</p>
          <Button type="button" className="self-start" onClick={() => window.location.reload()}>
            {m.errorReload}
          </Button>
        </Card>
      </main>
    );
  }
}
