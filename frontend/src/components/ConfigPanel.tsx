// Este formulario permite editar los parámetros globales que afectan la
// generación de horarios, incluyendo nombre del colegio, jornadas por nivel y
// bloques administrativos.
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchConfig,
  updateConfig,
  type AdministrativeBlock,
  type AdministrativeMode,
  type LevelScheduleConfig
} from '../services/configService'
import { FIXED_LEVELS } from '../store/useSchedulerData'
import { WORKING_DAYS } from '../utils/schedulePreview'

interface AdministrativeBlockForm extends AdministrativeBlock {
  id: string
}

interface LevelScheduleForm extends LevelScheduleConfig {
  administrativeBlocks: AdministrativeBlockForm[]
}

// Paleta utilizada para diferenciar visualmente la tarjeta de cada nivel.
const LEVEL_BADGES: Record<string, string> = {
  parvulario:
    'border-l-4 border-amber-400 bg-amber-50/60 dark:border-amber-400/80 dark:bg-amber-400/10',
  basico: 'border-l-4 border-sky-500 bg-sky-50/60 dark:border-sky-400/80 dark:bg-sky-400/10',
  media: 'border-l-4 border-violet-500 bg-violet-50/60 dark:border-violet-400/80 dark:bg-violet-400/10'
}

export function ConfigPanel() {
  const queryClient = useQueryClient()
  const { data, isFetching } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: {
      schoolName: 'School Scheduler',
      blockDuration: 45,
      theme: 'dark',
      dayStart: '08:00',
      lunchStart: '13:00',
      lunchDuration: 60,
      fullTimeWeeklyHours: 38,
      levelSchedules: FIXED_LEVELS.map((level, index) => ({
        levelId: level.id,
        endTime: index === 0 ? '13:00' : index === 1 ? '15:00' : '17:00',
        administrativeMode: index === 0 ? 'none' : 'custom',
        administrativeBlocks: [],
        breakDurations: index === 0 ? [20] : index === 1 ? [15] : [10, 15]
      }))
    }
  })
  const [schoolName, setSchoolName] = useState('School Scheduler')
  const [blockDuration, setBlockDuration] = useState(45)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [dayStart, setDayStart] = useState('08:00')
  const [lunchStart, setLunchStart] = useState('13:00')
  const [lunchDuration, setLunchDuration] = useState(60)
  const [fullTimeWeeklyHours, setFullTimeWeeklyHours] = useState(38)
  const [levelSchedules, setLevelSchedules] = useState<LevelScheduleForm[]>([])
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation(updateConfig, {
    onSuccess: (updated) => {
      queryClient.setQueryData(['config'], updated)
      setError(null)
    }
  })

  useEffect(() => {
    if (data) {
      setSchoolName(data.schoolName ?? 'School Scheduler')
      setBlockDuration(data.blockDuration ?? 45)
      setTheme(data.theme ?? 'dark')
      setDayStart(data.dayStart ?? '08:00')
      setLunchStart(data.lunchStart ?? '13:00')
      setLunchDuration(data.lunchDuration ?? 60)
      setFullTimeWeeklyHours(data.fullTimeWeeklyHours ?? 38)
      setLevelSchedules(
        FIXED_LEVELS.map((level) => {
          const match = data.levelSchedules?.find((schedule) => schedule.levelId === level.id)
          return {
            levelId: level.id,
            endTime: match?.endTime ?? (level.id === 'parvulario' ? '13:00' : level.id === 'basico' ? '15:00' : '17:00'),
            administrativeMode:
              (match?.administrativeMode as AdministrativeMode) ?? (level.id === 'parvulario' ? 'none' : 'custom'),
            administrativeBlocks: (match?.administrativeBlocks ?? []).map((block) => ({
              ...block,
              id: `${level.id}-${block.day}-${block.start}-${block.end}`
            })),
            breakDurations:
              match?.breakDurations?.length && match.breakDurations.some((item) => item > 0)
                ? match.breakDurations.map((duration) => Math.max(1, Math.round(Number(duration) || 0)))
                : level.id === 'parvulario'
                ? [20]
                : level.id === 'basico'
                ? [15]
                : [10, 15]
          }
        })
      )
    }
  }, [data])

  const lunchStartMinutes = useMemo(() => {
    const [hours = '0', minutes = '0'] = (lunchStart ?? '00:00').split(':')
    return Number(hours) * 60 + Number(minutes)
  }, [lunchStart])

  const lunchEndMinutes = lunchStartMinutes + Math.max(0, lunchDuration)

  const validateSchedules = () => {
    for (const schedule of levelSchedules) {
      if (schedule.administrativeMode === 'custom' && schedule.administrativeBlocks.length === 0) {
        setError(
          `Agrega al menos una franja administrativa o marca "No aplica" para el nivel ${
            FIXED_LEVELS.find((level) => level.id === schedule.levelId)?.name ?? schedule.levelId
          }.`
        )
        return false
      }

      for (const block of schedule.administrativeBlocks) {
        const [startHour = '0', startMinute = '0'] = block.start.split(':')
        const [endHour = '0', endMinute = '0'] = block.end.split(':')
        const startMinutes = Number(startHour) * 60 + Number(startMinute)
        const endMinutes = Number(endHour) * 60 + Number(endMinute)

        if (!block.start || !block.end || startMinutes >= endMinutes) {
          setError('Verifica que las horas administrativas tengan un rango válido (inicio menor que término).')
          return false
        }

        const overlapsLunch =
          lunchDuration > 0 &&
          ((startMinutes >= lunchStartMinutes && startMinutes < lunchEndMinutes) ||
            (endMinutes > lunchStartMinutes && endMinutes <= lunchEndMinutes) ||
            (startMinutes <= lunchStartMinutes && endMinutes >= lunchEndMinutes))

        if (overlapsLunch) {
          setError('Las horas administrativas no pueden coincidir con el horario de almuerzo configurado.')
          return false
        }
      }
    }

    setError(null)
    return true
  }

  const handleSave = () => {
    if (!validateSchedules()) {
      return
    }

    mutation.mutate({
      schoolName,
      blockDuration,
      theme,
      dayStart,
      lunchStart,
      lunchDuration,
      fullTimeWeeklyHours,
      levelSchedules: levelSchedules.map(({ administrativeBlocks, breakDurations, ...rest }) => ({
        ...rest,
        breakDurations: breakDurations.map((duration) => Math.max(1, Math.round(Number(duration) || 0))),
        administrativeBlocks: administrativeBlocks.map(({ id, ...block }) => block)
      }))
    })
  }

  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Configuraciones Generales</h1>
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
        {isFetching && (
          <p className="text-sm text-slate-500 dark:text-slate-300">Sincronizando configuración...</p>
        )}
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Nombre del colegio</span>
          <input
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            maxLength={50}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Duración de bloque (minutos)</span>
          <input
            type="number"
            min={30}
            value={blockDuration}
            onChange={(event) => setBlockDuration(Math.max(30, Number(event.target.value) || 0))}
            className="w-32 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Hora de inicio de la jornada</span>
          <input
            type="time"
            value={dayStart}
            onChange={(event) => setDayStart(event.target.value)}
            className="w-40 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <div className="grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hora de almuerzo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Inicio</span>
              <input
                type="time"
                value={lunchStart}
                onChange={(event) => setLunchStart(event.target.value)}
                className="w-40 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Duración (minutos)</span>
              <input
                type="number"
                min={15}
                step={5}
                value={lunchDuration}
                onChange={(event) => setLunchDuration(Math.max(15, Number(event.target.value) || 0))}
                className="w-32 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Este bloque aparecerá automáticamente en las previsualizaciones y limita la cantidad de clases disponibles por día.
          </p>
        </div>
        <div className="grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Horarios por nivel</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define la hora de término diaria y las horas administrativas donde no se pueden agendar clases.
          </p>
          <div className="grid gap-4">
            {levelSchedules.map((schedule) => {
              const level = FIXED_LEVELS.find((item) => item.id === schedule.levelId)
              return (
                <div
                  key={schedule.levelId}
                  className={`rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-700 ${
                    LEVEL_BADGES[schedule.levelId] ?? ''
                  }`}
                >
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{level?.name ?? schedule.levelId}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ajusta la jornada y agrega horas administrativas específicas por día.
                      </p>
                    </div>
                  </header>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="grid gap-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Hora de término diaria</span>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(event) =>
                          setLevelSchedules((current) =>
                            current.map((item) =>
                              item.levelId === schedule.levelId ? { ...item, endTime: event.target.value } : item
                            )
                          )
                        }
                        className="w-40 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLevelSchedules((current) =>
                          current.map((item) =>
                            item.levelId === schedule.levelId
                              ? {
                                  ...item,
                                  administrativeBlocks: [
                                    ...item.administrativeBlocks,
                                    {
                                      id: `${schedule.levelId}-${Date.now()}`,
                                      day: WORKING_DAYS[0],
                                      start: '14:00',
                                      end: '15:00'
                                    }
                                  ]
                                }
                              : item
                          )
                        )
                      }
                      className="self-end rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand/60 dark:hover:text-brand"
                      disabled={schedule.administrativeMode === 'none'}
                    >
                      Agregar hora administrativa
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-300">Recreos (minutos entre bloques)</p>
                    <div className="grid gap-2">
                      {schedule.breakDurations.length === 0 && (
                        <p className="rounded border border-dashed border-amber-300 bg-amber-100/40 p-3 text-xs text-amber-700 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-200">
                          Agrega la duración de los recreos para que el generador separe los bloques.
                        </p>
                      )}
                      {schedule.breakDurations.map((duration, index) => (
                        <div key={`${schedule.levelId}-break-${index}`} className="flex flex-wrap items-center gap-3">
                          <input
                            type="number"
                            min={5}
                            step={5}
                            value={duration}
                            onChange={(event) =>
                              setLevelSchedules((current) =>
                                current.map((item) =>
                                  item.levelId === schedule.levelId
                                    ? {
                                        ...item,
                                        breakDurations: item.breakDurations.map((value, idx) =>
                                          idx === index ? Math.max(5, Number(event.target.value) || 5) : value
                                        )
                                      }
                                    : item
                                )
                              )
                            }
                            className="w-32 rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setLevelSchedules((current) =>
                                current.map((item) =>
                                  item.levelId === schedule.levelId
                                    ? {
                                        ...item,
                                        breakDurations: item.breakDurations.filter((_, idx) => idx !== index)
                                      }
                                    : item
                                )
                              )
                            }
                            className="rounded border border-transparent px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 dark:hover:border-rose-400 dark:hover:bg-rose-400/10"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLevelSchedules((current) =>
                          current.map((item) =>
                            item.levelId === schedule.levelId
                              ? {
                                  ...item,
                                  breakDurations: [...item.breakDurations, 15]
                                }
                              : item
                          )
                        )
                      }
                      className="w-fit rounded border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 dark:border-amber-400/70 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-400/10"
                    >
                      Agregar recreo
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-300">Horas administrativas (obligatorio seleccionar una opción)</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`administrative-${schedule.levelId}`}
                          value="none"
                          checked={schedule.administrativeMode === 'none'}
                          onChange={() =>
                            setLevelSchedules((current) =>
                              current.map((item) =>
                                item.levelId === schedule.levelId
                                  ? { ...item, administrativeMode: 'none', administrativeBlocks: [] }
                                  : item
                              )
                            )
                          }
                        />
                        No aplica
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`administrative-${schedule.levelId}`}
                          value="custom"
                          checked={schedule.administrativeMode === 'custom'}
                          onChange={() =>
                            setLevelSchedules((current) =>
                              current.map((item) =>
                                item.levelId === schedule.levelId
                                  ? { ...item, administrativeMode: 'custom' }
                                  : item
                              )
                            )
                          }
                        />
                        Personalizadas
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {schedule.administrativeBlocks.length === 0 ? (
                      <p className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                        {schedule.administrativeMode === 'none'
                          ? 'Marcaste que este nivel no tiene horas administrativas.'
                          : 'No hay horas administrativas configuradas para este nivel.'}
                      </p>
                    ) : (
                      schedule.administrativeBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="grid gap-3 rounded border border-slate-200 p-3 text-sm dark:border-slate-600 sm:grid-cols-4"
                        >
                          <label className="grid gap-1">
                            <span className="text-slate-600 dark:text-slate-300">Día</span>
                            <select
                              value={block.day}
                              onChange={(event) =>
                                setLevelSchedules((current) =>
                                  current.map((item) =>
                                    item.levelId === schedule.levelId
                                      ? {
                                          ...item,
                                          administrativeBlocks: item.administrativeBlocks.map((inner) =>
                                            inner.id === block.id ? { ...inner, day: event.target.value } : inner
                                          )
                                        }
                                      : item
                                  )
                                )
                              }
                              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            >
                              {WORKING_DAYS.map((day) => (
                                <option key={`${schedule.levelId}-${block.id}-${day}`} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className="text-slate-600 dark:text-slate-300">Inicio</span>
                            <input
                              type="time"
                              value={block.start}
                              onChange={(event) =>
                                setLevelSchedules((current) =>
                                  current.map((item) =>
                                    item.levelId === schedule.levelId
                                      ? {
                                          ...item,
                                          administrativeBlocks: item.administrativeBlocks.map((inner) =>
                                            inner.id === block.id ? { ...inner, start: event.target.value } : inner
                                          )
                                        }
                                      : item
                                  )
                                )
                              }
                              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-slate-600 dark:text-slate-300">Término</span>
                            <input
                              type="time"
                              value={block.end}
                              onChange={(event) =>
                                setLevelSchedules((current) =>
                                  current.map((item) =>
                                    item.levelId === schedule.levelId
                                      ? {
                                          ...item,
                                          administrativeBlocks: item.administrativeBlocks.map((inner) =>
                                            inner.id === block.id ? { ...inner, end: event.target.value } : inner
                                          )
                                        }
                                      : item
                                  )
                                )
                              }
                              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() =>
                                setLevelSchedules((current) =>
                                  current.map((item) =>
                                    item.levelId === schedule.levelId
                                      ? {
                                          ...item,
                                          administrativeBlocks: item.administrativeBlocks.filter((inner) => inner.id !== block.id)
                                        }
                                      : item
                                  )
                                )
                              }
                              className="rounded border border-transparent px-3 py-2 text-xs font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 dark:hover:border-rose-400 dark:hover:bg-rose-400/10"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Horas semanales contrato tiempo completo
          </span>
          <input
            type="number"
            min={1}
            value={fullTimeWeeklyHours}
            onChange={(event) => setFullTimeWeeklyHours(Math.max(1, Number(event.target.value) || 1))}
            className="w-32 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tema de la aplicación</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as 'light' | 'dark')}
            className="w-40 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button
          onClick={handleSave}
          className="mt-4 w-fit rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {mutation.isError && (
          <p className="text-sm text-rose-500">No se pudo guardar la configuración. Intenta nuevamente.</p>
        )}
        {mutation.isSuccess && (
          <p className="text-sm text-emerald-500">Configuración actualizada correctamente.</p>
        )}
      </div>
    </section>
  )
}
