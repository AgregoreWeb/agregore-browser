const { contextBridge, ipcRenderer, webFrame } = require('electron')

webFrame?.top?.executeJavaScript('window.location.href').then((url) => {
  if (url.startsWith('agregore://sites')) {
    contextBridge.exposeInMainWorld('sites', {
      list: () => ipcRenderer.invoke('sites-list')
    })
  }
})
