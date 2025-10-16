import { useQuery } from 'react-query'
import { fetchScheduleSummary } from '../services/scheduleService'

export function Dashboard() {
  const { data } = useQuery(['schedule-summary'], fetchScheduleSummary)

  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Resumen general</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-sm text-slate-600 dark:text-slate-400">Cursos generados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{data?.generatedCourses ?? 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-sm text-slate-600 dark:text-slate-400">Profesores asignados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{data?.assignedTeachers ?? 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-sm text-slate-600 dark:text-slate-400">Bloques programados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{data?.totalSessions ?? 0}</p>
        </article>
      </div>
    </section>
  )
}
