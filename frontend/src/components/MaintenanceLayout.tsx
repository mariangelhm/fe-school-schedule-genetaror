import { Link } from 'react-router-dom'
import { ReactNode } from 'react'

interface MaintenanceLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export function MaintenanceLayout({ title, description, children }: MaintenanceLayoutProps) {
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <Link
          to="/maintenance"
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand-dynamic dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          ← Volver a mantenedores
        </Link>
      </div>
      {children}
    </section>
  )
}
