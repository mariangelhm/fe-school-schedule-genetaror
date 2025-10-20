// Pantalla principal de generación: permite seleccionar un nivel, obtener la
// previsualización y lanzar la simulación de guardado final.
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import type { ConfigResponse } from '../services/configService'
import { generateSchedule } from '../services/scheduleService'
import { SchedulePreviewPanel } from '../components/SchedulePreviewPanel'
import { buildSchedulePreview, type SchedulePreview } from '../utils/schedulePreview'
import { DEFAULT_LEVEL_ID, useSchedulerDataStore } from '../store/useSchedulerData'

// Componente que coordina la selección de nivel y muestra la previsualización de horarios.
export function ScheduleView() {
  const levels = useSchedulerDataStore((state) => state.levels)
  const courses = useSchedulerDataStore((state) => state.courses)
  const subjects = useSchedulerDataStore((state) => state.subjects)
  const teachers = useSchedulerDataStore((state) => state.teachers)

  const [levelId, setLevelId] = useState(() => levels[0]?.id ?? DEFAULT_LEVEL_ID)
  const [year, setYear] = useState(new Date().getFullYear())
  const [replace, setReplace] = useState(true)
  const [previewData, setPreviewData] = useState<SchedulePreview | null>(null)
  const [feedback, setFeedback] = useState<
    | { type: 'success' | 'error' | 'info'; message: string }
    | null
  >(null)

  const queryClient = useQueryClient()

  const generationMutation = useMutation(generateSchedule, {
    onMutate: () => setFeedback({ type: 'info', message: 'Guardando horarios simulados…' }),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Horarios confirmados para el nivel seleccionado.' })
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'No se pudo finalizar la generación. Intenta nuevamente.' })
    }
  })

  useEffect(() => {
    if (!feedback) {
      return
    }
    const timeout = setTimeout(() => {
      setFeedback((current) => (current?.type === 'info' ? current : null))
    }, 5000)
    return () => clearTimeout(timeout)
  }, [feedback])

  useEffect(() => {
    setPreviewData(null)
  }, [levelId])

  const handlePreview = () => {
    const fallbackConfig: ConfigResponse = {
      schoolName: 'School Scheduler',
      blockDuration: 45,
      theme: 'dark',
      dayStart: '08:00',
      lunchStart: '13:00',
      lunchDuration: 60,
      fullTimeWeeklyHours: 38,
      levelSchedules: []
    }

    const config = queryClient.getQueryData<ConfigResponse>(['config']) ?? fallbackConfig
    const result = buildSchedulePreview({ levelId, courses, subjects, teachers, config })

    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
      setPreviewData(null)
      return
    }

    setPreviewData(result.preview ?? null)
    setFeedback({ type: 'success', message: 'Previsualización lista. Revisa antes de confirmar.' })
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Generación de horarios</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Selecciona un nivel para calcular los bloques semanales y revisar los resultados antes de confirmar.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nivel a generar</span>
            <select
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Año académico</span>
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={replace}
              onChange={(event) => setReplace(event.target.checked)}
              className="h-4 w-4"
            />
            Reemplazar versiones previas
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handlePreview}
            className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
          >
            Previsualizar horarios
          </button>
          <button
            onClick={() =>
              generationMutation.mutate({ levelId, year, replaceExisting: replace })
            }
            disabled={!previewData || generationMutation.isLoading}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {generationMutation.isLoading ? 'Confirmando…' : 'Confirmar generación'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-800/80 dark:text-slate-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {previewData && <SchedulePreviewPanel preview={previewData} />}
    </section>
  )
}
