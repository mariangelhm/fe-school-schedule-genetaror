import { useQuery } from 'react-query'
import { fetchScheduleSummary } from '../services/scheduleService'

export function Dashboard() {
  const { data } = useQuery(['schedule-summary'], fetchScheduleSummary)

  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Resumen general</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-lg border border-slate-800 bg-slate-800/60 p-6">
          <p className="text-sm text-slate-400">Cursos generados</p>
          <p className="mt-2 text-3xl font-bold">{data?.generatedCourses ?? 0}</p>
        </article>
        <article className="rounded-lg border border-slate-800 bg-slate-800/60 p-6">
          <p className="text-sm text-slate-400">Profesores asignados</p>
          <p className="mt-2 text-3xl font-bold">{data?.assignedTeachers ?? 0}</p>
        </article>
        <article className="rounded-lg border border-slate-800 bg-slate-800/60 p-6">
          <p className="text-sm text-slate-400">Bloques programados</p>
          <p className="mt-2 text-3xl font-bold">{data?.totalSessions ?? 0}</p>
        </article>
      </div>
    </section>
  )
}
