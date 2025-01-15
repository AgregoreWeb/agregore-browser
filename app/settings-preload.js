const { contextBridge, ipcRenderer, webFrame } = require('electron')

webFrame.top.executeJavaScript('window.location.href').then((url) => {
  if (url === 'agregore://settings') {
    contextBridge.exposeInMainWorld('settings', {
      save: (args) => ipcRenderer.invoke('settings-save', args)
    })
  }
})
