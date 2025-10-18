import { FormEvent, useMemo, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { FIXED_LEVELS, useSchedulerDataStore, type ClassroomData } from '../../store/useSchedulerData'

interface ClassroomDraft extends Omit<ClassroomData, 'id'> {}

export function ClassroomsPage() {
  const classrooms = useSchedulerDataStore((state) => state.classrooms)
  const addClassroom = useSchedulerDataStore((state) => state.addClassroom)
  const updateClassroom = useSchedulerDataStore((state) => state.updateClassroom)
  const removeClassroom = useSchedulerDataStore((state) => state.removeClassroom)
  const levels = useSchedulerDataStore((state) => state.levels)

  const levelOptions = useMemo(() => levels.filter((level) => FIXED_LEVELS.some((item) => item.id === level.id)), [levels])

  const [draft, setDraft] = useState<ClassroomDraft>({ name: '', levelId: levelOptions[0]?.id ?? FIXED_LEVELS[0].id })
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.levelId) {
      return
    }

    if (editingId) {
      updateClassroom(editingId, draft)
    } else {
      addClassroom(draft)
    }

    setDraft({ name: '', levelId: levelOptions[0]?.id ?? FIXED_LEVELS[0].id })
    setEditingId(null)
  }

  const handleEdit = (classroom: ClassroomData) => {
    setDraft({ name: classroom.name, levelId: classroom.levelId })
    setEditingId(classroom.id)
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft({ name: '', levelId: levelOptions[0]?.id ?? FIXED_LEVELS[0].id })
  }

  const handleDelete = (id: number) => {
    removeClassroom(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Aulas"
      description="Administra las salas disponibles para asignarlas a cursos según su nivel."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {classrooms.map((classroom) => {
                const levelName = levelOptions.find((level) => level.id === classroom.levelId)?.name ?? classroom.levelId
                return (
                  <tr key={classroom.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{classroom.name}</td>
                    <td className="px-4 py-3">{levelName}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-sm text-slate-500 transition hover:text-brand"
                          type="button"
                          onClick={() => handleEdit(classroom)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-rose-500 transition hover:text-rose-600"
                          type="button"
                          onClick={() => handleDelete(classroom.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {classrooms.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay aulas registradas.
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
          <h2 className="text-lg font-semibold">{editingId ? 'Editar aula' : 'Nueva aula'}</h2>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nombre</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              maxLength={50}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nivel</span>
            <select
              value={draft.levelId}
              onChange={(event) => setDraft((current) => ({ ...current, levelId: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              {levelOptions.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Actualizar aula' : 'Guardar aula'}
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
