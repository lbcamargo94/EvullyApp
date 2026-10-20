import { errorCode } from '@evully/app-core';
import { useState } from 'react';
import { settingsErrorByCode, settingsMessages as m } from './messages.pt-BR';

/** Message for a failed settings mutation; field codes are mapped by the caller first. */
export function settingsError(error: unknown, byCode: Record<string, string> = {}): string {
  const code = errorCode(error) ?? '';
  return byCode[code] ?? settingsErrorByCode[code] ?? m.genericError;
}

/** "Salvo." / error line shown under a settings card after a save. */
export function useSaveFeedback() {
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (save: () => Promise<unknown>, byCode?: Record<string, string>) => {
    setFeedback(null);
    try {
      await save();
      setFeedback({ ok: true, text: m.saved });
      return true;
    } catch (error) {
      setFeedback({ ok: false, text: settingsError(error, byCode) });
      return false;
    }
  };
  const node = feedback && (
    <p
      role={feedback.ok ? 'status' : 'alert'}
      className={feedback.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
    >
      {feedback.text}
    </p>
  );
  return { run, node, clear: () => setFeedback(null) };
}
