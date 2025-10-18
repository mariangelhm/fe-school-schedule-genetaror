import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { fetchScheduleSummary } from '../services/scheduleService'
import { useSchedulerDataStore } from '../store/useSchedulerData'

export function Dashboard() {
  const { data } = useQuery(['schedule-summary'], fetchScheduleSummary)
  const subjects = useSchedulerDataStore((state) => state.subjects)
  const courses = useSchedulerDataStore((state) => state.courses)
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const classrooms = useSchedulerDataStore((state) => state.classrooms)
  const levels = useSchedulerDataStore((state) => state.levels)
  const levelMap = new Map(levels.map((level) => [level.id, level.name]))
  const courseMap = new Map(courses.map((course) => [course.id, course.name]))
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject.name]))

  return (
    <section className="grid gap-8">
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">Resumen general</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-sm text-slate-600 dark:text-slate-400">Cursos generados</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{data?.generatedCourses ?? courses.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-sm text-slate-600 dark:text-slate-400">Profesores registrados</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{teachers.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-sm text-slate-600 dark:text-slate-400">Asignaturas activas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{subjects.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-sm text-slate-600 dark:text-slate-400">Aulas disponibles</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{classrooms.length}</p>
          </article>
        </div>
      </div>

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">Accesos rápidos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <QuickAccessCard to="/maintenance/subjects" label="Asignaturas" count={subjects.length} />
          <QuickAccessCard to="/maintenance/courses" label="Cursos" count={courses.length} />
          <QuickAccessCard to="/maintenance/teachers" label="Profesores" count={teachers.length} />
          <QuickAccessCard to="/maintenance/classrooms" label="Aulas" count={classrooms.length} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard
          title="Cursos"
          emptyMessage="Aún no has registrado cursos."
          items={courses.map((course) => ({
            id: course.id,
            primary: course.name,
            secondary: `Nivel: ${levelMap.get(course.levelId) ?? course.levelId}`
          }))}
          footerLink={{ to: '/maintenance/courses', label: 'Gestionar cursos' }}
        />
        <DataCard
          title="Profesores"
          emptyMessage="Agrega profesores para poder asignar clases."
          items={teachers.map((teacher) => {
            const courseNames = teacher.courseIds
              .map((courseId) => courseMap.get(courseId))
              .filter((name): name is string => Boolean(name))
            const levelName = levelMap.get(teacher.levelId) ?? teacher.levelId
            const subjectNames = teacher.subjectIds
              .map((subjectId) => subjectMap.get(subjectId))
              .filter((name): name is string => Boolean(name))
            const contractLabel = teacher.contractType === 'full-time' ? 'Tiempo completo' : 'Tiempo parcial'
            return {
              id: teacher.id,
              primary: teacher.name,
              secondary: `${subjectNames.length} asignaturas · ${contractLabel} · Nivel: ${levelName} · Cursos: ${
                courseNames.length > 0 ? courseNames.join(', ') : 'Sin cursos'
              }`
            }
          })}
          footerLink={{ to: '/maintenance/teachers', label: 'Gestionar profesores' }}
        />
        <DataCard
          title="Asignaturas"
          emptyMessage="Registra asignaturas para construir los horarios."
          items={subjects.map((subject) => ({
            id: subject.id,
            primary: subject.name,
            secondary: `Nivel: ${levelMap.get(subject.levelId) ?? subject.levelId} · Bloques/semana: ${
              subject.weeklyBlocks
            }`
          }))}
          footerLink={{ to: '/maintenance/subjects', label: 'Gestionar asignaturas' }}
        />
        <DataCard
          title="Aulas"
          emptyMessage="Crea aulas para asignarlas a los cursos."
          items={classrooms.map((classroom) => ({
            id: classroom.id,
            primary: classroom.name,
            secondary: `Nivel: ${levelMap.get(classroom.levelId) ?? classroom.levelId}`
          }))}
          footerLink={{ to: '/maintenance/classrooms', label: 'Gestionar aulas' }}
        />
      </div>
    </section>
  )
}

interface QuickAccessCardProps {
  to: string
  label: string
  count: number
}

function QuickAccessCard({ to, label, count }: QuickAccessCardProps) {
  return (
    <Link
      to={to}
      className="flex flex-col justify-between rounded border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand hover:text-brand-dynamic dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:text-white"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-4 text-2xl font-bold">{count}</span>
      <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">Ver detalles</span>
    </Link>
  )
}

interface DataCardProps {
  title: string
  items: { id: number; primary: string; secondary: string }[]
  emptyMessage: string
  footerLink: { to: string; label: string }
}

function DataCard({ title, items, emptyMessage, footerLink }: DataCardProps) {
  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <Link to={footerLink.to} className="text-xs font-semibold text-brand-dynamic hover:underline">
          {footerLink.label}
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="rounded border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-semibold text-slate-700 dark:text-slate-200">{item.primary}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.secondary}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
