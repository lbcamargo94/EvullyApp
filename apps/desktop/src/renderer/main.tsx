import { App } from '@evully/app-web';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ipcEvullyClient } from './ipc-client';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App client={ipcEvullyClient} />
  </StrictMode>,
);
