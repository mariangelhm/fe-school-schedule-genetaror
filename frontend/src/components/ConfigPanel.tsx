import { useMutation, useQuery, useQueryClient } from 'react-query'
import { fetchConfig, updateConfig, type CycleConfig } from '../services/configService'
import { useEffect, useState } from 'react'

interface CycleForm extends CycleConfig {
  levelsInput: string
}

export function ConfigPanel() {
  const queryClient = useQueryClient()
  const { data, isFetching } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: {
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
        }
      ]
    }
  })
  const [color, setColor] = useState('#2563eb')
  const [schoolName, setSchoolName] = useState('School Scheduler')
  const [blockDuration, setBlockDuration] = useState(45)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [dayStart, setDayStart] = useState('08:00')
  const [lunchStart, setLunchStart] = useState('13:00')
  const [lunchDuration, setLunchDuration] = useState(60)
  const [cycles, setCycles] = useState<CycleForm[]>([])

  const mutation = useMutation(updateConfig, {
    onSuccess: (updated) => {
      queryClient.setQueryData(['config'], updated)
    }
  })

  useEffect(() => {
    if (data) {
      setColor(data.primaryColor ?? '#2563eb')
      setSchoolName(data.schoolName ?? 'School Scheduler')
      setBlockDuration(data.blockDuration ?? 45)
      setTheme(data.theme ?? 'dark')
      setDayStart(data.dayStart ?? '08:00')
      setLunchStart(data.lunchStart ?? '13:00')
      setLunchDuration(data.lunchDuration ?? 60)
      setCycles(
        (data.cycles ?? []).map((cycle) => ({
          ...cycle,
          levelsInput: cycle.levels.join(', ')
        }))
      )
    }
  }, [data])

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', color)
  }, [color])

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
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Color principal</span>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-24 cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ciclos académicos</h2>
            <button
              type="button"
              onClick={() =>
                setCycles((current) => [
                  ...current,
                  {
                    id: `cycle-${Date.now()}`,
                    name: 'Nuevo ciclo',
                    levels: [],
                    levelsInput: '',
                    endTime: '15:00'
                  }
                ])
              }
              className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand/60 dark:hover:text-brand"
            >
              Agregar ciclo
            </button>
          </div>
          {cycles.length === 0 ? (
            <p className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Define al menos un ciclo para controlar las horas máximas por día según los niveles.
            </p>
          ) : (
            <div className="grid gap-3">
              {cycles.map((cycle, index) => (
                <div key={cycle.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cycle.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>Ciclo #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCycles((current) => current.filter((item) => item.id !== cycle.id))
                        }
                        className="rounded border border-transparent px-2 py-1 font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 dark:hover:border-rose-400 dark:hover:bg-rose-400/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Nombre</span>
                      <input
                        value={cycle.name}
                        onChange={(event) =>
                          setCycles((current) =>
                            current.map((item) =>
                              item.id === cycle.id ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Hora de término diaria</span>
                      <input
                        type="time"
                        value={cycle.endTime}
                        onChange={(event) =>
                          setCycles((current) =>
                            current.map((item) =>
                              item.id === cycle.id ? { ...item, endTime: event.target.value } : item
                            )
                          )
                        }
                        className="w-40 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                  <label className="mt-3 grid gap-1 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Niveles (separados por coma)</span>
                    <textarea
                      value={cycle.levelsInput}
                      onChange={(event) =>
                        setCycles((current) =>
                          current.map((item) =>
                            item.id === cycle.id ? { ...item, levelsInput: event.target.value } : item
                          )
                        )
                      }
                      rows={2}
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cada ciclo limita la cantidad de bloques diarios disponibles para los cursos asociados y se aplica automáticamente en la generación.
          </p>
        </div>
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
        <button
          onClick={() =>
            mutation.mutate({
              schoolName,
              primaryColor: color,
              blockDuration,
              theme,
              dayStart,
              lunchStart,
              lunchDuration,
              cycles: cycles.map(({ levelsInput, ...rest }) => ({
                ...rest,
                levels: levelsInput
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
              }))
            })
          }
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
