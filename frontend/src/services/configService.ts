import axios from 'axios'

export interface ConfigResponse {
  schoolName?: string
  primaryColor?: string
  blockDuration?: number
  theme?: 'light' | 'dark'
  dayStart?: string
}

const LOCAL_STORAGE_KEY = 'scheduler-config-cache'

const defaultConfig: Required<Pick<ConfigResponse, 'schoolName' | 'primaryColor' | 'blockDuration' | 'theme' | 'dayStart'>> = {
  schoolName: 'School Scheduler',
  primaryColor: '#2563eb',
  blockDuration: 45,
  theme: 'dark',
  dayStart: '08:00'
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

function readLocalConfig(): ConfigResponse | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const stored = storage.getItem(LOCAL_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ConfigResponse) : null
  } catch (error) {
    console.warn('No fue posible leer la configuración local', error)
    return null
  }
}

function writeLocalConfig(config: ConfigResponse) {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.warn('No fue posible guardar la configuración local', error)
  }
}

function mergeWithDefaults(config?: ConfigResponse): ConfigResponse {
  return { ...defaultConfig, ...config }
}

export async function fetchConfig(): Promise<ConfigResponse> {
  try {
    const { data } = await axios.get<ConfigResponse>('config')
    const merged = mergeWithDefaults(data)
    writeLocalConfig(merged)
    return merged
  } catch (error) {
    const fallback = mergeWithDefaults(readLocalConfig() ?? undefined)
    return fallback
  }
}

interface UpdateConfigPayload {
  schoolName: string
  primaryColor: string
  blockDuration: number
  theme: 'light' | 'dark'
  dayStart: string
}

export async function updateConfig(payload: UpdateConfigPayload): Promise<ConfigResponse> {
  try {
    const { data } = await axios.put<ConfigResponse>('config', payload)
    const merged = mergeWithDefaults(data)
    writeLocalConfig(merged)
    return merged
  } catch (error) {
    const merged = mergeWithDefaults(payload)
    writeLocalConfig(merged)
    return merged
  }
}
