import { createContext, useContext } from 'react';

/** True when the host app ships the component catalog (development builds only). */
export const CatalogContext = createContext(false);

export function useCatalogAvailable(): boolean {
  return useContext(CatalogContext);
}
