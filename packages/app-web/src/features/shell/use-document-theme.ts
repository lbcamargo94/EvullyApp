import type { Theme } from '@evully/contracts';
import { useEffect } from 'react';

/**
 * Applies the theme chosen in Settings › Geral. Without `data-theme` the
 * tokens follow the system (`prefers-color-scheme`), see packages/tokens.
 */
export function useDocumentTheme(theme: Theme | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (!theme || theme === 'system') delete root.dataset['theme'];
    else root.dataset['theme'] = theme;
  }, [theme]);
}
