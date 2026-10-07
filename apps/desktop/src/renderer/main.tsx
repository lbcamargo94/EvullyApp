import { App } from '@evully/app-web';
import { StrictMode } from 'react';
import { HashRouter } from 'react-router';
import { createRoot } from 'react-dom/client';
import { ipcEvullyClient } from './ipc-client';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App client={ipcEvullyClient} Router={HashRouter} />
  </StrictMode>,
);
