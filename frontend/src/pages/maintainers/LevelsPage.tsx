import { FormEvent, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { useSchedulerDataStore, type LevelData } from '../../store/useSchedulerData'

interface LevelDraft {
  name: string
  description: string
}

const emptyDraft: LevelDraft = {
  name: '',
  description: ''
}

export function LevelsPage() {
  const levels = useSchedulerDataStore((state) => state.levels)
  const addLevel = useSchedulerDataStore((state) => state.addLevel)
  const updateLevel = useSchedulerDataStore((state) => state.updateLevel)
  const removeLevel = useSchedulerDataStore((state) => state.removeLevel)
  const [draft, setDraft] = useState<LevelDraft>({ ...emptyDraft })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      return
    }

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() ? draft.description.trim() : undefined
    }

    if (editingId) {
      updateLevel(editingId, payload)
    } else {
      addLevel(payload)
    }

    setDraft({ ...emptyDraft })
    setEditingId(null)
  }

  const handleEdit = (level: LevelData) => {
    setEditingId(level.id)
    setDraft({
      name: level.name,
      description: level.description ?? ''
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft({ ...emptyDraft })
  }

  const handleDelete = (id: string) => {
    removeLevel(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Niveles"
      description="Administra los niveles educativos disponibles para cursos y asignaturas."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Descripción</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {levels.map((level) => {
                const isGeneral = level.id === 'general'
                return (
                  <tr key={level.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{level.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{level.description ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-sm text-slate-500 transition hover:text-brand"
                          type="button"
                          onClick={() => handleEdit(level)}
                        >
                          Editar
                        </button>
                        {!isGeneral && (
                          <button
                            className="text-sm text-rose-500 transition hover:text-rose-600"
                            type="button"
                            onClick={() => handleDelete(level.id)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {levels.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay niveles registrados todavía.
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
          <h2 className="text-lg font-semibold">{editingId ? 'Editar nivel' : 'Nuevo nivel'}</h2>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nombre</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Descripción</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder="Opcional: notas sobre el rango de cursos o jornada"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Actualizar nivel' : 'Guardar nivel'}
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
