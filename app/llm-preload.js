const { contextBridge, ipcRenderer, webFrame } = require('electron')

const iteratorMaps = new Map()
let iteratorId = 1

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
        const id = await globalThis._agregoreLLM.chatStream(args)
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
        const id = await globalThis._agregoreLLM.completeStream(prompt, args)
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

async function complete (prompt, args = {}) {
  return ipcRenderer.invoke('llm-complete', { prompt, ...args })
}

async function chatStream (args) {
  const { id } = await ipcRenderer.invoke('llm-chat-stream', args)
  const localId = iteratorId++
  iteratorMaps.set(localId, id)
  return localId
}

async function completeStream (prompt, args = {}) {
  const { id } = await ipcRenderer.invoke('llm-complete-stream', { prompt, ...args })
  const localId = iteratorId++
  iteratorMaps.set(localId, id)
  return localId
}

async function iteratorNext (localId) {
  const id = iteratorMaps.get(localId)
  if (!id) throw new Error('Unknown iterator ID')
  return ipcRenderer.invoke('llm-iterate-next', { id })
}

async function iteratorReturn (localId) {
  const id = iteratorMaps.get(localId)
  if (!id) throw new Error('Unknown iterator ID')
  iteratorMaps.delete(localId)
  return ipcRenderer.invoke('llm-iterate-return', { id })
}
