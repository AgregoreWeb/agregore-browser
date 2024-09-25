import config from './config.js'
import { ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

const { baseURL, apiKey, model, enabled } = config.llm

let isInitialized = false

ipcMain.handle('llm-supported', async (event) => {
  return isSupported()
})

ipcMain.handle('llm-chat', async (event, args) => {
  return chat(args)
})

ipcMain.handle('llm-complete', async (event, args) => {
  return complete(args)
})

export async function isSupported () {
  if (!enabled) return false
  const has = await hasModel()
  if (has) return true
  return (apiKey === 'ollama')
}

export function addPreloads (session) {
  const preloadPath = path.join(__dirname, 'llm-preload.js')
  const preloads = session.getPreloads()
  preloads.push(preloadPath)
  session.setPreloads(preloads)
}

export async function init () {
  if (!enabled) throw new Error('LLM API is not enabled')
  if (isInitialized) return
  // TODO: prompt for download
  if (apiKey === 'ollama') {
    const has = await hasModel()
    if (!has) {
      await pullModel()
    }
  }
  isInitialized = true
}

async function listModels () {
  const { data } = await get('./models', 'Unable to list models')
  return data
}

async function pullModel () {
  await post('/api/pull', {
    name: model
  }, `Unable to pull model ${model}`)
}

async function hasModel () {
  try {
    const models = await listModels()

    return !!models.find(({ id }) => id === model)
  } catch {
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
    model,
    temperature,
    max_tokens: maxTokens,
    stop
  }, 'Unable to generate completion')

  return choices[0].text
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
    model,
    temperature,
    max_tokens: maxTokens,
    stop
  }, 'Unable to generate completion')

  return choices[0].text
}

async function get (path, errorMessage) {
  const url = new URL(path, baseURL).href

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`${errorMessage} ${await response.text()}`)
  }

  return await response.json()
}

async function post (path, data, errorMessage) {
  const url = new URL(path, baseURL).href

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf8',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`${errorMessage} ${await response.text()}`)
  }

  return await response.json()
}
