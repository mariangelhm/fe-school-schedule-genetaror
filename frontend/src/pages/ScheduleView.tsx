import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { exportSchedule, fetchScheduleSummary, generateSchedule } from '../services/scheduleService'

export function ScheduleView() {
  const [mode, setMode] = useState<'full' | 'course'>('full')
  const [courseId, setCourseId] = useState<number | undefined>()
  const [year, setYear] = useState(new Date().getFullYear())
  const [replace, setReplace] = useState(true)

  const queryClient = useQueryClient()
  const { data } = useQuery(['schedule-summary'], fetchScheduleSummary)

  const generationMutation = useMutation(generateSchedule, {
    onSuccess: () => queryClient.invalidateQueries(['schedule-summary'])
  })

  const exportMutation = useMutation(exportSchedule)

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Generación de horarios</h1>
        <button
          className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white"
          onClick={() => exportMutation.mutate('pdf')}
        >
          Exportar PDF
        </button>
      </div>
      <div className="grid gap-4 rounded-lg bg-slate-800/60 p-6">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Modo</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as 'full' | 'course')}
              className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="full">Completo</option>
              <option value="course">Por curso</option>
            </select>
          </label>
          {mode === 'course' && (
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">ID del curso</span>
              <input
                type="number"
                value={courseId ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setCourseId(value === '' ? undefined : Number(value))
                }}
                className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
              />
            </label>
          )}
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Año académico</span>
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={replace}
              onChange={(event) => setReplace(event.target.checked)}
              className="h-4 w-4"
            />
            Reemplazar horarios existentes
          </label>
        </div>
        <button
          className="w-fit rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={mode === 'course' && !courseId}
          onClick={() =>
            generationMutation.mutate({
              mode,
              courseId,
              year,
              replaceExisting: replace
            })
          }
        >
          Generar horarios
        </button>
      </div>
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Último resultado</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded border border-slate-800 bg-slate-800/60 p-4">
            <p className="text-sm text-slate-400">Cursos</p>
            <p className="text-2xl font-semibold">{data?.generatedCourses ?? 0}</p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-800/60 p-4">
            <p className="text-sm text-slate-400">Profesores</p>
            <p className="text-2xl font-semibold">{data?.assignedTeachers ?? 0}</p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-800/60 p-4">
            <p className="text-sm text-slate-400">Bloques</p>
            <p className="text-2xl font-semibold">{data?.totalSessions ?? 0}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
