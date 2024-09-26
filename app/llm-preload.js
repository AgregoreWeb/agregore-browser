const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('llm', {
  chat: (args) => ipcRenderer.invoke('llm-chat', args),
  complete: (prompt, args = {}) => ipcRenderer.invoke('llm-complete', { ...args, prompt }),
  isSupported: () => ipcRenderer.invoke('llm-supported')
})
