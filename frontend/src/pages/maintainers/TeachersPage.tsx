import { FormEvent, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { fetchConfig, type CycleConfig } from '../../services/configService'
import { useSchedulerDataStore, type ContractType, type TeacherData } from '../../store/useSchedulerData'

type TeacherDraft = Omit<TeacherData, 'id' | 'subjects' | 'cycles'> & { subjects: string; cycles: string[] }

const placeholderCycles: CycleConfig[] = [
  {
    id: 'ciclo-basico-i',
    name: 'Ciclo Básico I',
    levels: ['1° Básico', '2° Básico', '3° Básico'],
    endTime: '13:00'
  }
]

function createEmptyTeacher(cycles: CycleConfig[]): TeacherDraft {
  return {
    name: '',
    contractType: 'Completo',
    subjects: '',
    cycles: cycles.map((cycle) => cycle.id),
    weeklyHours: 30,
    availableBlocks: ''
  }
}

export function TeachersPage() {
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const addTeacher = useSchedulerDataStore((state) => state.addTeacher)
  const updateTeacher = useSchedulerDataStore((state) => state.updateTeacher)
  const removeTeacher = useSchedulerDataStore((state) => state.removeTeacher)

  const { data: config } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: { cycles: placeholderCycles }
  })

  const cycles = config?.cycles ?? placeholderCycles
  const [draft, setDraft] = useState<TeacherDraft>(() => createEmptyTeacher(cycles))
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      cycles: current.cycles.filter((cycleId) => cycles.some((cycle) => cycle.id === cycleId))
    }))
  }, [cycles])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.subjects.trim() || draft.cycles.length === 0) {
      return
    }

    const payload: Omit<TeacherData, 'id'> = {
      name: draft.name,
      contractType: draft.contractType,
      subjects: draft.subjects.split(',').map((subject) => subject.trim()).filter(Boolean),
      cycles: draft.cycles,
      weeklyHours: draft.weeklyHours,
      availableBlocks: draft.availableBlocks
    }

    if (editingId) {
      updateTeacher(editingId, payload)
    } else {
      addTeacher(payload)
    }

    setDraft(createEmptyTeacher(cycles))
    setEditingId(null)
  }

  const handleEdit = (teacher: TeacherData) => {
    setEditingId(teacher.id)
    setDraft({
      name: teacher.name,
      contractType: teacher.contractType,
      subjects: teacher.subjects.join(', '),
      cycles: teacher.cycles,
      weeklyHours: teacher.weeklyHours,
      availableBlocks: teacher.availableBlocks
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(createEmptyTeacher(cycles))
  }

  const handleDelete = (id: number) => {
    removeTeacher(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Profesores"
      description="Gestiona la disponibilidad de profesores, asignaturas y ciclos para evitar conflictos."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Contrato</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Asignaturas</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Ciclos</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Horas</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Disponibilidad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3 font-medium">{teacher.name}</td>
                  <td className="px-4 py-3">{teacher.contractType}</td>
                  <td className="px-4 py-3">
                    <ul className="list-disc pl-4">
                      {teacher.subjects.map((subject) => (
                        <li key={subject}>{subject}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="list-disc pl-4">
                      {teacher.cycles.map((cycleId) => {
                        const cycleName = cycles.find((cycle) => cycle.id === cycleId)?.name ?? cycleId
                        return <li key={cycleId}>{cycleName}</li>
                      })}
                    </ul>
                  </td>
                  <td className="px-4 py-3">{teacher.weeklyHours}</td>
                  <td className="px-4 py-3">{teacher.availableBlocks}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-sm text-slate-500 transition hover:text-brand"
                        type="button"
                        onClick={() => handleEdit(teacher)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-sm text-rose-500 transition hover:text-rose-600"
                        type="button"
                        onClick={() => handleDelete(teacher.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
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
          <h2 className="text-lg font-semibold">{editingId ? 'Editar profesor' : 'Nuevo profesor'}</h2>
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
              placeholder="Separa por coma: Lenguaje, Matemática"
              required
            />
          </label>
          <fieldset className="grid gap-2 rounded border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Ciclos asignados
            </legend>
            {cycles.map((cycle) => (
              <label key={cycle.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.cycles.includes(cycle.id)}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setDraft((current) => ({
                      ...current,
                      cycles: checked
                        ? Array.from(new Set([...current.cycles, cycle.id]))
                        : current.cycles.filter((item) => item !== cycle.id)
                    }))
                  }}
                  className="h-4 w-4"
                />
                <span>{cycle.name}</span>
              </label>
            ))}
            {draft.cycles.length === 0 && (
              <p className="text-xs text-rose-500">Selecciona al menos un ciclo.</p>
            )}
          </fieldset>
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
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Actualizar profesor' : 'Guardar profesor'}
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
