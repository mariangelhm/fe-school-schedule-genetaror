import axios from 'axios'

export interface CycleConfig {
  id: string
  name: string
  levels: string[]
  endTime: string
}

export interface ConfigResponse {
  schoolName?: string
  primaryColor?: string
  blockDuration?: number
  theme?: 'light' | 'dark'
  dayStart?: string
  lunchStart?: string
  lunchDuration?: number
  cycles?: CycleConfig[]
}

const LOCAL_STORAGE_KEY = 'scheduler-config-cache'

const defaultConfig: Required<
  Pick<
    ConfigResponse,
    'schoolName' | 'primaryColor' | 'blockDuration' | 'theme' | 'dayStart' | 'lunchStart' | 'lunchDuration' | 'cycles'
  >
> = {
  schoolName: 'School Scheduler',
  primaryColor: '#2563eb',
  blockDuration: 45,
  theme: 'dark',
  dayStart: '08:00',
  lunchStart: '13:00',
  lunchDuration: 60,
  cycles: [
    {
      id: 'ciclo-basico-i',
      name: 'Ciclo Básico I',
      levels: ['1° Básico', '2° Básico', '3° Básico'],
      endTime: '13:00'
    },
    {
      id: 'ciclo-basico-ii',
      name: 'Ciclo Básico II',
      levels: ['4° Básico', '5° Básico'],
      endTime: '15:00'
    },
    {
      id: 'ciclo-media',
      name: 'Ciclo Media',
      levels: ['1° Medio', '2° Medio', '3° Medio', '4° Medio'],
      endTime: '17:00'
    }
  ]
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
  const merged = { ...config }

  return {
    ...defaultConfig,
    ...merged,
    cycles: merged?.cycles?.length ? merged.cycles : defaultConfig.cycles
  }
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
  lunchStart: string
  lunchDuration: number
  cycles: CycleConfig[]
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
