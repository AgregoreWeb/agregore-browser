const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('llm', {
  chat: (args) => ipcRenderer.invoke('llm-chat', args),
  complete: (args) => ipcRenderer.invoke('llm-complete', args),
  isSupported: (prompt, args = {}) => ipcRenderer.invoke('llm-supported', { ...args, prompt })
})
