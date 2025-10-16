import { FormEvent, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { useSchedulerDataStore, type EventData } from '../../store/useSchedulerData'

const today = new Date()

function formatDateForInput(date: Date) {
  return date.toISOString().split('T')[0]
}

const emptyEvent: Omit<EventData, 'id'> = {
  date: formatDateForInput(today),
  description: '',
  noClasses: false
}

export function EventsPage() {
  const events = useSchedulerDataStore((state) => state.events)
  const addEvent = useSchedulerDataStore((state) => state.addEvent)
  const updateEvent = useSchedulerDataStore((state) => state.updateEvent)
  const removeEvent = useSchedulerDataStore((state) => state.removeEvent)
  const [draft, setDraft] = useState<Omit<EventData, 'id'>>({ ...emptyEvent })
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.description.trim()) {
      return
    }

    if (editingId) {
      updateEvent(editingId, draft)
    } else {
      addEvent(draft)
    }
    setDraft({ ...emptyEvent })
    setEditingId(null)
  }

  const handleEdit = (schoolEvent: EventData) => {
    setEditingId(schoolEvent.id)
    setDraft({
      date: schoolEvent.date,
      description: schoolEvent.description,
      noClasses: schoolEvent.noClasses
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft({ ...emptyEvent })
  }

  const handleDelete = (id: number) => {
    removeEvent(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Eventos escolares"
      description="Programa actividades especiales o días sin clases que afectan la planificación del horario."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Fecha</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Descripción</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">¿Hay clases?</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {events.map((schoolEvent) => (
                <tr key={schoolEvent.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3 font-medium">{schoolEvent.date}</td>
                  <td className="px-4 py-3">{schoolEvent.description}</td>
                  <td className="px-4 py-3">
                    {schoolEvent.noClasses ? (
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
                        Sin clases
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
                        Con clases
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-sm text-slate-500 transition hover:text-brand"
                        type="button"
                        onClick={() => handleEdit(schoolEvent)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-sm text-rose-500 transition hover:text-rose-600"
                        type="button"
                        onClick={() => handleDelete(schoolEvent.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay eventos registrados.
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
          <h2 className="text-lg font-semibold">{editingId ? 'Editar actividad' : 'Nueva actividad'}</h2>
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
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={draft.noClasses}
              onChange={(event) => setDraft((current) => ({ ...current, noClasses: event.target.checked }))}
              className="h-4 w-4"
            />
            El evento suspende clases
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Actualizar evento' : 'Guardar evento'}
            </button>
            {editingId && (
              <button type="button" className="text-sm text-slate-500 hover:text-slate-700" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </MaintenanceLayout>
  )
}
