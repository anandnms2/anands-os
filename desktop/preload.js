const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aosDesktop', { connectWeb: (u, p) => ipcRenderer.invoke('web:connect', u, p), disconnectWeb: () => ipcRenderer.invoke('web:disconnect'), close: () => ipcRenderer.invoke('win:close') });
