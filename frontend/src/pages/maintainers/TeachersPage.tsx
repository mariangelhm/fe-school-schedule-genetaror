import { FormEvent, useMemo, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { useSchedulerDataStore, type ContractType, type TeacherData } from '../../store/useSchedulerData'

type TeacherDraft = Omit<TeacherData, 'id' | 'subjects'> & { subjects: string }

const emptyTeacher: TeacherDraft = {
  name: '',
  contractType: 'Completo',
  subjects: '',
  weeklyHours: 30,
  availableBlocks: ''
}

export function TeachersPage() {
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const addTeacher = useSchedulerDataStore((state) => state.addTeacher)
  const removeTeacher = useSchedulerDataStore((state) => state.removeTeacher)
  const [draft, setDraft] = useState<TeacherDraft>({ ...emptyTeacher })

  const formattedTeachers = useMemo(
    () =>
      teachers.map((teacher) => ({
        ...teacher,
        subjectsLabel: teacher.subjects.join(', ')
      })),
    [teachers]
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.subjects.trim()) {
      return
    }

    addTeacher({
      name: draft.name,
      contractType: draft.contractType,
      subjects: draft.subjects.split(',').map((subject) => subject.trim()).filter(Boolean),
      weeklyHours: draft.weeklyHours,
      availableBlocks: draft.availableBlocks
    })
    setDraft({ ...emptyTeacher })
  }

  const handleDelete = (id: number) => {
    removeTeacher(id)
  }

  return (
    <MaintenanceLayout
      title="Profesores"
      description="Gestiona la disponibilidad de profesores, asignaturas y carga horaria para evitar conflictos."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Contrato</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Asignaturas</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Horas</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Disponibilidad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {formattedTeachers.map((teacher) => (
                <tr key={teacher.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3 font-medium">{teacher.name}</td>
                  <td className="px-4 py-3">{teacher.contractType}</td>
                  <td className="px-4 py-3">{teacher.subjectsLabel}</td>
                  <td className="px-4 py-3">{teacher.weeklyHours}</td>
                  <td className="px-4 py-3">{teacher.availableBlocks}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm text-rose-500 hover:text-rose-600"
                      type="button"
                      onClick={() => handleDelete(teacher.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {formattedTeachers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay profesores registrados.
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
          <h2 className="text-lg font-semibold">Nuevo profesor</h2>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">Tipo de contrato</span>
            <select
              value={draft.contractType}
              onChange={(event) => setDraft((current) => ({ ...current, contractType: event.target.value as ContractType }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="Completo">Completo</option>
              <option value="Parcial">Parcial</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Asignaturas que imparte</span>
            <textarea
              value={draft.subjects}
              onChange={(event) => setDraft((current) => ({ ...current, subjects: event.target.value }))}
              rows={3}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Carga horaria semanal</span>
            <input
              type="number"
              min={1}
              value={draft.weeklyHours}
              onChange={(event) => setDraft((current) => ({ ...current, weeklyHours: Math.max(1, Number(event.target.value) || 1) }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Bloques disponibles</span>
            <input
              value={draft.availableBlocks}
              onChange={(event) => setDraft((current) => ({ ...current, availableBlocks: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
            Guardar profesor
          </button>
        </form>
      </div>
    </MaintenanceLayout>
  )
}
