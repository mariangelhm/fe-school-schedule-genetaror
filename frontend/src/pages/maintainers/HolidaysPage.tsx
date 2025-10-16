import { FormEvent, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'

interface Holiday {
  id: number
  date: string
  description: string
}

const today = new Date()

function formatDateForInput(date: Date) {
  return date.toISOString().split('T')[0]
}

const initialHolidays: Holiday[] = [
  { id: 1, date: formatDateForInput(new Date(today.getFullYear(), 4, 1)), description: 'Día del trabajador' },
  { id: 2, date: formatDateForInput(new Date(today.getFullYear(), 8, 18)), description: 'Fiestas Patrias' }
]

const emptyHoliday: Holiday = {
  id: 0,
  date: formatDateForInput(today),
  description: ''
}

export function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [draft, setDraft] = useState<Holiday>({ ...emptyHoliday })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.description.trim()) {
      return
    }

    const newHoliday: Holiday = {
      ...draft,
      id: Date.now()
    }

    setHolidays((current) => [newHoliday, ...current].sort((a, b) => a.date.localeCompare(b.date)))
    setDraft({ ...emptyHoliday })
  }

  const handleDelete = (id: number) => {
    setHolidays((current) => current.filter((holiday) => holiday.id !== id))
  }

  return (
    <MaintenanceLayout
      title="Feriados"
      description="Registra los días feriados para excluirlos automáticamente durante la generación de horarios."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Fecha</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Descripción</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {holidays.map((holiday) => (
                <tr key={holiday.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3 font-medium">{holiday.date}</td>
                  <td className="px-4 py-3">{holiday.description}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm text-rose-500 hover:text-rose-600"
                      type="button"
                      onClick={() => handleDelete(holiday.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay feriados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
        >
          <h2 className="text-lg font-semibold">Nuevo feriado</h2>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Fecha</span>
            <input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Descripción</span>
            <input
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
            Guardar feriado
          </button>
        </form>
      </div>
    </MaintenanceLayout>
  )
}
