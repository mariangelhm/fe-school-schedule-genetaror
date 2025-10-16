import { useMutation, useQuery, useQueryClient } from 'react-query'
import { fetchConfig, updateConfig } from '../services/configService'
import { useEffect, useState } from 'react'

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
      dayStart: '08:00'
    }
  })
  const [color, setColor] = useState('#2563eb')
  const [schoolName, setSchoolName] = useState('School Scheduler')
  const [blockDuration, setBlockDuration] = useState(45)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [dayStart, setDayStart] = useState('08:00')

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
              dayStart
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
