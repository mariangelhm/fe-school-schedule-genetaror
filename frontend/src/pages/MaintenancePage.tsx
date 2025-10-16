import { Link } from 'react-router-dom'

const resources = [
  { name: 'Asignaturas', href: '/subjects' },
  { name: 'Cursos', href: '/courses' },
  { name: 'Profesores', href: '/teachers' },
  { name: 'Feriados', href: '/holidays' },
  { name: 'Eventos', href: '/events' }
]

export function MaintenancePage() {
  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Mantenedores</h1>
      <p className="text-sm text-slate-400">
        Usa estos accesos rápidos para administrar la información base que se utiliza en la generación automática de horarios.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {resources.map((resource) => (
          <Link
            key={resource.href}
            to={resource.href}
            className="rounded border border-slate-800 bg-slate-800/60 px-4 py-6 text-center text-sm font-semibold text-slate-200 hover:border-brand hover:text-white"
          >
            {resource.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
