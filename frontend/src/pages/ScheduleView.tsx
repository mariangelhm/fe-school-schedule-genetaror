import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { exportSchedule, fetchScheduleSummary, generateSchedule } from '../services/scheduleService'
import type { ConfigResponse } from '../services/configService'
import { useSchedulerDataStore } from '../store/useSchedulerData'
import { buildSchedulePreview, type SchedulePreview } from '../utils/schedulePreview'
import { SchedulePreviewModal } from '../components/SchedulePreviewModal'

export function ScheduleView() {
  const [mode, setMode] = useState<'full' | 'course'>('full')
  const [courseId, setCourseId] = useState<number | undefined>()
  const [year, setYear] = useState(new Date().getFullYear())
  const [replace, setReplace] = useState(true)
  const [feedback, setFeedback] = useState<
    | { type: 'success'; message: string }
    | { type: 'error'; message: string }
    | { type: 'info'; message: string }
    | null
  >(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<SchedulePreview | null>(null)

  const queryClient = useQueryClient()
  const { data } = useQuery(['schedule-summary'], fetchScheduleSummary)
  const courses = useSchedulerDataStore((state) => state.courses)
  const subjects = useSchedulerDataStore((state) => state.subjects)
  const teachers = useSchedulerDataStore((state) => state.teachers)

  const generationMutation = useMutation(generateSchedule, {
    onMutate: () => setFeedback({ type: 'info', message: 'Generando horarios. Esto puede tardar unos segundos…' }),
    onSuccess: (summary) => {
      queryClient.setQueryData(['schedule-summary'], summary)
      setFeedback({ type: 'success', message: 'Horarios generados correctamente.' })
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'No se pudo completar la generación. Verifica el backend y vuelve a intentar.' })
    },
    onSettled: () => {
      queryClient.invalidateQueries(['schedule-summary'])
    }
  })

  const exportMutation = useMutation(exportSchedule, {
    onSuccess: (file) => {
      setFeedback({ type: 'success', message: `Exportación lista (${file.format.toUpperCase()}).` })
    },
    onError: () => setFeedback({ type: 'error', message: 'La exportación falló. Intenta más tarde.' })
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

  return (
    <>
      <section className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Generación de horarios</h1>
          <button
            className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={exportMutation.isLoading}
            onClick={() => exportMutation.mutate('pdf')}
          >
            {exportMutation.isLoading ? 'Exportando…' : 'Exportar PDF'}
          </button>
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
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Modo</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as 'full' | 'course')}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="full">Completo</option>
                <option value="course">Por curso</option>
              </select>
            </label>
            {mode === 'course' && (
              <label className="grid gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">ID del curso</span>
                <input
                  type="number"
                  value={courseId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    setCourseId(value === '' ? undefined : Number(value))
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </label>
            )}
            <label className="grid gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Año académico</span>
              <input
                type="number"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
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
            className="w-fit rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={(mode === 'course' && !courseId) || generationMutation.isLoading}
            onClick={() => {
          const config =
            queryClient.getQueryData<ConfigResponse>(['config']) ??
            ({
              blockDuration: 45,
              dayStart: '08:00',
              lunchStart: '13:00',
              lunchDuration: 60,
              levelSchedules: []
            } as ConfigResponse)

              const result = buildSchedulePreview({
                courses,
                subjects,
                teachers,
                mode,
                courseId,
                config
              })

              if (result.error) {
                setFeedback({ type: 'error', message: result.error })
                return
              }

              setPreviewData(result.preview ?? null)
              setPreviewOpen(true)
            }}
          >
            {generationMutation.isLoading ? 'Generando…' : 'Previsualizar horarios'}
          </button>
        </div>
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold">Último resultado</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-sm text-slate-600 dark:text-slate-400">Cursos</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data?.generatedCourses ?? 0}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-sm text-slate-600 dark:text-slate-400">Profesores</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data?.assignedTeachers ?? 0}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-sm text-slate-600 dark:text-slate-400">Bloques</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data?.totalSessions ?? 0}</p>
            </div>
          </div>
        </div>
      </section>
      <SchedulePreviewModal
        open={previewOpen}
        preview={previewData}
        mode={mode}
        year={year}
        onClose={() => {
          setPreviewOpen(false)
        }}
        onPreviewChange={(updated) => setPreviewData(updated)}
        onConfirm={(finalPreview) => {
          setPreviewOpen(false)
          setPreviewData(finalPreview)
          generationMutation.mutate({
            mode,
            courseId,
            year,
            replaceExisting: replace
          })
        }}
      />
    </>
  )
}
