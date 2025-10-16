import { useMutation, useQuery, useQueryClient } from 'react-query'
import { fetchConfig, updateConfig } from '../services/configService'
import { useEffect, useState } from 'react'

export function ConfigPanel() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(['config'], fetchConfig)
  const [color, setColor] = useState('#2563eb')
  const [schoolName, setSchoolName] = useState('School Scheduler')
  const [blockDuration, setBlockDuration] = useState(45)

  const mutation = useMutation(updateConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries(['config'])
    }
  })

  useEffect(() => {
    if (data) {
      setColor(data.primaryColor ?? '#2563eb')
      setSchoolName(data.schoolName ?? 'School Scheduler')
      setBlockDuration(data.blockDuration ?? 45)
    }
  }, [data])

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', color)
  }, [color])

  if (isLoading && !data) {
    return <p>Cargando configuración...</p>
  }

  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Configuraciones Generales</h1>
      <div className="grid gap-4 rounded-lg bg-slate-800/60 p-6">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Nombre del colegio</span>
          <input
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Color principal</span>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-24 cursor-pointer rounded border border-slate-600 bg-slate-900"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Duración de bloque (minutos)</span>
          <input
            type="number"
            min={30}
            value={blockDuration}
            onChange={(event) => setBlockDuration(Math.max(30, Number(event.target.value) || 0))}
            className="w-32 rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          onClick={() =>
            mutation.mutate({
              schoolName,
              primaryColor: color,
              blockDuration
            })
          }
          className="mt-4 w-fit rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white"
        >
          Guardar cambios
        </button>
      </div>
    </section>
  )
}
