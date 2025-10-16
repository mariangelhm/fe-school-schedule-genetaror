import { Link } from 'react-router-dom'

const resources = [
  { name: 'Asignaturas', href: '/maintenance/subjects' },
  { name: 'Cursos', href: '/maintenance/courses' },
  { name: 'Profesores', href: '/maintenance/teachers' },
  { name: 'Feriados', href: '/maintenance/holidays' },
  { name: 'Eventos', href: '/maintenance/events' }
]

export function MaintenancePage() {
  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Mantenedores</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Usa estos accesos rápidos para administrar la información base que se utiliza en la generación automática de horarios.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {resources.map((resource) => (
          <Link
            key={resource.href}
            to={resource.href}
            className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand hover:text-brand-dynamic dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:text-white"
          >
            {resource.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
