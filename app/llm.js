import config from './config.js'
import { ipcMain, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

let isInitialized = false

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
