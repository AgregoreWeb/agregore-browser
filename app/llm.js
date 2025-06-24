import config from './config.js'
import { ipcMain, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

let isInitialized = false
let createWindow = null
// Completion Iterators, id to iterator
const inProgress = new Map()
let streamId = 1

export function setCreateWindow (create) {
  createWindow = create
}

ipcMain.handle('llm-supported', async (event) => {
  if (!config.llm.enabled) return false
  return isSupported()
})

ipcMain.handle('llm-chat', async (event, args) => {
  if (!config.llm.enabled) return Promise.reject(new Error('LLM API is disabled'))
  return chat(args)
})

ipcMain.handle('llm-complete', async (event, args) => {
  if (!config.llm.enabled) return Promise.reject(new Error('LLM API is disabled'))
  return complete(args)
})

ipcMain.handle('llm-chat-stream', async (event, args) => {
  if (!config.llm.enabled) return Promise.reject(new Error('LLM API is disabled'))
  const id = streamId++
  const iterator = chatStream(args)
  inProgress.set(id, iterator)
  return { id }
})

ipcMain.handle('llm-complete-stream', async (event, args) => {
  if (!config.llm.enabled) return Promise.reject(new Error('LLM API is disabled'))
  const id = streamId++
  const iterator = completeStream(args)
  inProgress.set(id, iterator)
  return { id }
})

ipcMain.handle('llm-iterate-next', async (event, args) => {
  const { id } = args
  if (!inProgress.has(id)) throw new Error('Unknown Iterator')
  const iterator = inProgress.get(id)
  const { done, value } = await iterator.next()
  if (done) inProgress.delete(id)
  return { done, value }
})

ipcMain.handle('llm-iterate-return', async (event, args) => {
  const { id } = args
  if (!inProgress.has(id)) return
  const iterator = inProgress.get(id)
  await iterator.return()
})

export async function isSupported () {
  if (!config.llm.enabled) return false
  const has = await hasModel()
  if (has) return true
  return (config.llm.apiKey === 'ollama')
}

export function addPreloads (session) {
  const preloadPath = path.join(__dirname, 'llm-preload.js')
  const preloads = session.getPreloads()
  preloads.push(preloadPath)
  session.setPreloads(preloads)
}

export async function init () {
  if (!config.llm.enabled) throw new Error('LLM API is disabled')
  if (isInitialized) return
  // TODO: prompt for download
  if (config.llm.apiKey === 'ollama') {
    try {
      await listModels()
    } catch {
      await showNeedsOllama()
      throw new Error('LLM API needs system service install')
    }

    const has = await hasModel()
    if (!has) {
      await confirmPull()
      await pullModel()
      await notifyPullDone()
    }
  }
  isInitialized = true
}

async function listModels () {
  const { data } = await get('./models', 'Unable to list models')
  return data
}

async function showNeedsOllama () {
  const { response, checkboxChecked } = await dialog.showMessageBox({
    title: 'Set up Ollama',
    message: 'Agregore needs a local install of Ollama in order to use AI features. Since it has not been detected, would you like help instaaling it, or would yopu like to go configure the settings to use another endpoint?',
    buttons: ['Show Help', 'Configure', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    checkboxLabel: 'Remember this choice'
  })

  if (response === 2) {
    if (checkboxChecked) {
      config.llm.enabled = false
    }
    throw new Error('Cannot use LLM, user denied help')
  }
  if (response === 0) {
    await createWindow('hyper://agregore.mauve.moe/docs/ai#setting-up-ollama')
  }
  if (response === 1) {
    await createWindow('agregore://settings#llm')
  }
}

async function confirmPull () {
  const { response, checkboxChecked } = await dialog.showMessageBox({
    title: 'Download AI Model?',
    message: 'Agregore wants to download a large language model to allow websites to use AI features. This can take a few minutes and can take several gigabytes of internet. Do you want to allow this?',
    buttons: ['Yes', 'No'],
    defaultId: 0,
    cancelId: 1,
    checkboxLabel: 'Remember this choice'
  })

  if (response === 1) {
    if (checkboxChecked) {
      config.llm.enabled = false
    }
    throw new Error('Cannot use LLM, user denied download')
  }
}

async function notifyPullDone () {
  await dialog.showMessageBox({
    title: 'AI Model Downloaded',
    message: `Agregore has finished downloading the large lanfguage model. You can clear it by running 'ollama rm ${config.llm.model}'`
  })
}

async function pullModel () {
  await post('/api/pull', {
    name: config.llm.model
  }, `Unable to pull model ${config.llm.model}`, false)
}

async function hasModel () {
  try {
    const models = await listModels()

    return !!models.find(({ id }) => id === config.llm.model)
  } catch (e) {
    console.error(e.stack)
    return false
  }
}

export async function chat ({
  messages = [],
  temperature,
  maxTokens,
  stop
}) {
  await init()
  const { choices } = await post('./chat/completions', {
    messages,
    model: config.llm.model,
    temperature,
    max_tokens: maxTokens,
    stop
  }, 'Unable to generate completion')

  return choices[0].message
}

export async function complete ({
  prompt,
  temperature,
  maxTokens,
  stop
}) {
  await init()
  const { choices } = await post('./completions', {
    prompt,
    model: config.llm.model,
    temperature,
    max_tokens: maxTokens,
    stop
  }, 'Unable to generate completion')

  return choices[0].text
}

export async function * chatStream ({
  messages = [],
  temperature,
  maxTokens,
  stop
} = {}) {
  await init()
  for await (const { choices } of stream('./chat/completions', {
    messages,
    model: config.llm.model,
    temperature,
    max_tokens: maxTokens,
    stop
  }, 'Unable to generate completion')) {
    yield choices[0].delta
  }
}

export async function * completeStream ({
  prompt,
  temperature,
  maxTokens,
  stop
}) {
  await init()

  for await (const { choices } of stream('./completions', {
    prompt,
    model: config.llm.model,
    temperature,
    max_tokens: maxTokens,
    stop
  }, 'Unable to generate completion')) {
    yield choices[0].text
  }
}

async function * stream (path, data = {}, errorMessage = 'Unable to stream') {
  const url = new URL(path, config.llm.baseURL).href
  if (!data.stream) data.stream = true

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf8',
      Authorization: `Bearer ${config.llm.apiKey}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`${errorMessage} ${await response.text()}`)
  }

  const decoder = new TextDecoder('utf-8')
  let remaining = ''

  const reader = response.body.getReader()

  for await (const chunk of iterate(reader)) {
    remaining += decoder.decode(chunk)
    const lines = remaining.split('data: ')
    remaining = lines.splice(-1)[0]

    yield * lines
      .filter((line) => !!line)
      .map((line) => JSON.parse(line))
  }
}

async function get (path, errorMessage, parseBody = true) {
  const url = new URL(path, config.llm.baseURL).href

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`${errorMessage} ${await response.text()}`)
  }

  if (parseBody) {
    return await response.json()
  } else {
    return await response.text()
  }
}

async function post (path, data, errorMessage, shouldParse = true) {
  const url = new URL(path, config.llm.baseURL).href

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf8',
      Authorization: `Bearer ${config.llm.apiKey}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`${errorMessage} ${await response.text()}`)
  }

  if (shouldParse) {
    return await response.json()
  }
  return await response.text()
}

async function * iterate (reader) {
  while (true) {
    const { done, value } = await reader.read()
    if (done) return
    yield value
  }
}
