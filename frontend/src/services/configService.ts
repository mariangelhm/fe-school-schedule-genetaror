// Este módulo encapsula la lectura y escritura de la configuración global
// empleada por el frontend para simular la respuesta de un backend.
import axios from 'axios'

export interface ConfigResponse {
  schoolName?: string
  blockDuration?: number
  theme?: 'light' | 'dark'
  dayStart?: string
  lunchStart?: string
  lunchDuration?: number
  fullTimeWeeklyHours?: number
  levelSchedules?: LevelScheduleConfig[]
}

export interface AdministrativeBlock {
  day: string
  start: string
  end: string
}

export type AdministrativeMode = 'none' | 'custom'

export interface LevelScheduleConfig {
  levelId: string
  endTime: string
  administrativeMode: AdministrativeMode
  administrativeBlocks: AdministrativeBlock[]
  breakDurations: number[]
}

const LOCAL_STORAGE_KEY = 'scheduler-config-cache'

const defaultConfig: Required<
  Pick<
    ConfigResponse,
    |
      'schoolName'
      | 'blockDuration'
      | 'theme'
      | 'dayStart'
      | 'lunchStart'
      | 'lunchDuration'
      | 'fullTimeWeeklyHours'
      | 'levelSchedules'
  >
> = {
  schoolName: 'School Scheduler',
  blockDuration: 45,
  theme: 'dark',
  dayStart: '08:00',
  lunchStart: '13:00',
  lunchDuration: 60,
  fullTimeWeeklyHours: 38,
  levelSchedules: [
    {
      levelId: 'parvulario',
      endTime: '13:00',
      administrativeMode: 'none',
      administrativeBlocks: [],
      breakDurations: [20]
    },
    {
      levelId: 'basico',
      endTime: '15:00',
      administrativeMode: 'custom',
      administrativeBlocks: [],
      breakDurations: [15]
    },
    {
      levelId: 'media',
      endTime: '17:00',
      administrativeMode: 'custom',
      administrativeBlocks: [],
      breakDurations: [10, 15]
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

function normaliseBreaks(breakDurations?: number[]) {
  return (breakDurations ?? [])
    .map((duration) => Math.max(0, Math.round(Number(duration) || 0)))
    .filter((duration) => duration > 0)
}

function mergeWithDefaults(config?: ConfigResponse): ConfigResponse {
  const merged = { ...config }

  const levelSchedules = defaultConfig.levelSchedules.map((defaultSchedule) => {
    const inputSchedule = merged.levelSchedules?.find(
      (schedule) => schedule.levelId === defaultSchedule.levelId
    )
    const blocks = Array.isArray(inputSchedule?.administrativeBlocks)
      ? inputSchedule?.administrativeBlocks ?? []
      : defaultSchedule.administrativeBlocks
    const breaks = normaliseBreaks(inputSchedule?.breakDurations)
    return {
      ...defaultSchedule,
      ...inputSchedule,
      administrativeMode: inputSchedule?.administrativeMode ?? defaultSchedule.administrativeMode,
      administrativeBlocks: blocks,
      breakDurations: breaks.length ? breaks : defaultSchedule.breakDurations
    }
  })

  return {
    ...defaultConfig,
    ...merged,
    levelSchedules,
    fullTimeWeeklyHours:
      typeof merged?.fullTimeWeeklyHours === 'number'
        ? Math.max(0, merged.fullTimeWeeklyHours)
        : defaultConfig.fullTimeWeeklyHours
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
  blockDuration: number
  theme: 'light' | 'dark'
  dayStart: string
  lunchStart: string
  lunchDuration: number
  fullTimeWeeklyHours: number
  levelSchedules: LevelScheduleConfig[]
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
