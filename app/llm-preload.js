const { contextBridge, ipcRenderer, webFrame } = require('electron')

const iteratorMaps = new Map()
const iteratorId = 1

contextBridge.exposeInMainWorld('_agregoreLLM', {
  chat,
  complete,
  chatStream,
  completeStream,
  iteratorNext,
  iteratorReturn,
  isSupported: () => ipcRenderer.invoke('llm-supported')
})

webFrame.executeJavaScript(`(${setUpGlobal.toString()})()`)

function setUpGlobal () {
  globalThis.llm = {
    chat,
    complete,
    isSupported: () => globalThis._agregoreLLM.isSupported()
  }

  function chat (args) {
    return {
      then (onResolve, onReject) {
        globalThis._agregoreLLM.chat(args).then(onResolve, onReject)
      },
      async * [Symbol.asyncIterator] () {
        const { id } = await globalThis._agregoreLLM.chatStream(args)
        try {
          while (true) {
            const { done, value } = await globalThis._agregoreLLM.iteratorNext(id)
            if (done) break
            yield value
          }
        } finally {
          globalThis._agregoreLLM.iteratorReturn(id)
        }
      }
    }
  }

  function complete (prompt, args = {}) {
    return {
      then (onResolve, onReject) {
        globalThis._agregoreLLM.complete(prompt, args).then(onResolve, onReject)
      },
      async * [Symbol.asyncIterator] () {
        const { id } = await globalThis._agregoreLLM.completeStream(prompt, args)
        try {
          while (true) {
            const { done, value } = await globalThis._agregoreLLM.iteratorNext(id)
            if (done) break
            yield value
          }
        } finally {
          globalThis._agregoreLLM.iteratorReturn(id)
        }
      }
    }
  }
}

async function chat (args) {
  return ipcRenderer.invoke('llm-chat', args)
}
async function chatStream (args) {
  return ipcRenderer.invoke('llm-chat-stream', args)
}

async function complete (prompt, args = {}) {
  return ipcRenderer.invoke('llm-complete', { prompt, ...args })
}

async function completeStream (prompt, args = {}) {
  return ipcRenderer.invoke('llm-complete-stream', { prompt, ...args })
}

async function iteratorNext (id) {
  return ipcRenderer.invoke('llm-iterate-next', { id })
}

async function iteratorReturn (id) {
  return ipcRenderer.invoke('llm-iterate-return', { id })
}
