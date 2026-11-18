import { App } from '@evully/app-web';
import { lazy, StrictMode } from 'react';
import { HashRouter } from 'react-router';
import { createRoot } from 'react-dom/client';
import { ipcEvullyClient } from './ipc-client';
import './styles.css';

// The component catalog (DESIGN.md §8) only exists in development: in a
// release build DEV is false and the import is dropped from the bundle.
const Catalog = import.meta.env.DEV
  ? lazy(() => import('@evully/app-web/catalog').then((m) => ({ default: m.CatalogScreen })))
  : undefined;

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App client={ipcEvullyClient} Router={HashRouter} Catalog={Catalog} />
  </StrictMode>,
);
