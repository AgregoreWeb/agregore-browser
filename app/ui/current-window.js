window.getCurrentWindow = function getCurrentWindow () {
  const { ipcRenderer } = require('electron')
  const EventEmitter = require('events')

  const EVENTS = [
    'navigating',
    'history-buttons-change',
    'page-title-updated',
    'enter-html-full-screen',
    'leave-html-full-screen',
    'update-target-url',
    'browser-actions-changed',
    'close',
    'enter-full-screen',
    'leave-full-screen'
  ]

  class CurrentWindow extends EventEmitter {
    constructor () {
      super()

      for (const name of EVENTS) {
        ipcRenderer.on(`agregore-window-${name}`, (event, ...args) => this.emit(name, ...args))
      }
    }

    async goBack () {
      return this.invoke('goBack')
    }

    async goForward () {
      return this.invoke('goForward')
    }

    async reload () {
      return this.invoke('reload')
    }

    async focus () {
      return this.invoke('focus')
    }

    async loadURL (url) {
      return this.invoke('loadURL', url)
    }

    async getURL () {
      return this.invoke('getURL')
    }

    async findInPage (value, opts) {
      return this.invoke('findInPage', value, opts)
    }

    async stopFindInPage () {
      return this.invoke('stopFindInPage')
    }

    async setBounds (rect) {
      return this.invoke('setBounds', rect)
    }

    async * searchHistory (query, limit = 8) {
      // Open iterator, get back an id
      // Invoke next until done
      await this.invoke('searchHistoryStart', query, limit)
      while (true) {
        const { done, value } = await this.invoke('searchHistoryNext')
        if (done) break
        yield value
      }
    }

    async listExtensionActions () {
      return this.invoke('listExtensionActions')
    }

    async clickExtensionAction (id) {
      return this.invoke('clickExtensionAction', id)
    }

    async invoke (name, ...args) {
      return ipcRenderer.invoke(`agregore-window-${name}`, ...args)
    }
  }

  return new CurrentWindow()
}
