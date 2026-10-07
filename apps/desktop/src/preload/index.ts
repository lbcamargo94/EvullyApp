import { contextBridge, ipcRenderer } from 'electron';
import type { EvullyBridge } from '../shared/bridge';

const bridge: EvullyBridge = {
  invoke: (channel, input) => ipcRenderer.invoke(channel, input),
};

contextBridge.exposeInMainWorld('evully', bridge);
