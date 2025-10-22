// Este módulo encapsula la lectura y escritura de la configuración global
// empleada por el frontend para simular la respuesta de un backend.
import httpClient from './httpClient'

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

export type BreakMode = 'none' | 'custom'

export interface BreakConfig {
  start: string
  duration: number
}

export interface LevelScheduleConfig {
  levelId: string
  endTime: string
  administrativeMode: AdministrativeMode
  administrativeBlocks: AdministrativeBlock[]
  breakMode: BreakMode
  breaks: BreakConfig[]
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
      breakMode: 'custom',
      breaks: [
        {
          start: '09:30',
          duration: 20
        }
      ]
    },
    {
      levelId: 'basico',
      endTime: '15:00',
      administrativeMode: 'custom',
      administrativeBlocks: [],
      breakMode: 'custom',
      breaks: [
        {
          start: '10:15',
          duration: 15
        }
      ]
    },
    {
      levelId: 'media',
      endTime: '17:00',
      administrativeMode: 'custom',
      administrativeBlocks: [],
      breakMode: 'custom',
      breaks: [
        {
          start: '10:15',
          duration: 10
        },
        {
          start: '14:45',
          duration: 15
        }
      ]
    }
  ]
}

// Función que obtiene localStorage si existe en el contexto del navegador.
function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

// Función que lee la configuración guardada en localStorage.
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

// Función que persiste la configuración en localStorage.
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

// Función que normaliza la lista de recreos según el modo seleccionado.
function normaliseBreaks(breaks?: BreakConfig[], mode?: BreakMode) {
  if (mode === 'none') {
    return []
  }

  return (breaks ?? [])
    .map((entry) => ({
      start: entry.start ?? '10:00',
      duration: Math.max(1, Math.round(Number(entry.duration) || 0))
    }))
    .filter((entry) => entry.duration > 0)
}

// Función que combina la configuración entrante con los valores por defecto.
function mergeWithDefaults(config?: ConfigResponse): ConfigResponse {
  const merged = { ...config }

  const levelSchedules = defaultConfig.levelSchedules.map((defaultSchedule) => {
    const inputSchedule = merged.levelSchedules?.find(
      (schedule) => schedule.levelId === defaultSchedule.levelId
    )
    const blocks = Array.isArray(inputSchedule?.administrativeBlocks)
      ? inputSchedule?.administrativeBlocks ?? []
      : defaultSchedule.administrativeBlocks
    const legacyDurations = Array.isArray((inputSchedule as any)?.breakDurations)
      ? ((inputSchedule as any)?.breakDurations as number[])
      : undefined
    const breakMode: BreakMode =
      (inputSchedule?.breakMode as BreakMode | undefined) ??
      (legacyDurations && legacyDurations.length === 0 ? 'none' : defaultSchedule.breakMode)
    const baseBreaks =
      inputSchedule?.breaks ??
      (legacyDurations
        ? legacyDurations.map((duration, index) => ({
            start:
              defaultSchedule.breaks[index % defaultSchedule.breaks.length]?.start ??
              defaultSchedule.breaks[0]?.start ??
              '10:00',
            duration
          }))
        : undefined)
    const breaks = normaliseBreaks(baseBreaks, breakMode)
    return {
      ...defaultSchedule,
      ...inputSchedule,
      administrativeMode: inputSchedule?.administrativeMode ?? defaultSchedule.administrativeMode,
      administrativeBlocks: blocks,
      breakMode,
      breaks
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

// Función que obtiene la configuración combinando almacenamiento local y valores por defecto.
export async function fetchConfig(): Promise<ConfigResponse> {
  try {
    const { data } = await httpClient.get<ConfigResponse>('config')
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

// Función que guarda la configuración y devuelve el estado normalizado.
export async function updateConfig(payload: UpdateConfigPayload): Promise<ConfigResponse> {
  try {
    const { data } = await httpClient.put<ConfigResponse>('config', payload)
    const merged = mergeWithDefaults(data)
    writeLocalConfig(merged)
    return merged
  } catch (error) {
    const merged = mergeWithDefaults(payload)
    writeLocalConfig(merged)
    return merged
  }
}
