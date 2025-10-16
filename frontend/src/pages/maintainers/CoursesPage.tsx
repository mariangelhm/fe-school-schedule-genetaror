import { FormEvent, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { fetchConfig, type CycleConfig } from '../../services/configService'
import { useSchedulerDataStore, type CourseData } from '../../store/useSchedulerData'

type CourseDraft = Omit<CourseData, 'id'>

const placeholderCycles: CycleConfig[] = [
  {
    id: 'ciclo-basico-i',
    name: 'Ciclo Básico I',
    levels: ['1° Básico', '2° Básico', '3° Básico'],
    endTime: '13:00'
  }
]

function createEmptyCourse(cycles: CycleConfig[]): CourseDraft {
  return {
    name: '',
    level: '',
    cycleId: cycles[0]?.id ?? '',
    headTeacher: '',
    students: 30
  }
}

export function CoursesPage() {
  const courses = useSchedulerDataStore((state) => state.courses)
  const addCourse = useSchedulerDataStore((state) => state.addCourse)
  const updateCourse = useSchedulerDataStore((state) => state.updateCourse)
  const removeCourse = useSchedulerDataStore((state) => state.removeCourse)

  const { data: config } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: { cycles: placeholderCycles }
  })

  const cycles = config?.cycles ?? placeholderCycles
  const [draft, setDraft] = useState<CourseDraft>(() => createEmptyCourse(cycles))
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      cycleId: current.cycleId && cycles.some((cycle) => cycle.id === current.cycleId) ? current.cycleId : cycles[0]?.id ?? ''
    }))
  }, [cycles])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.level.trim() || !draft.headTeacher.trim() || !draft.cycleId) {
      return
    }

    if (editingId) {
      updateCourse(editingId, draft)
    } else {
      addCourse(draft)
    }

    setDraft(createEmptyCourse(cycles))
    setEditingId(null)
  }

  const handleEdit = (course: CourseData) => {
    setEditingId(course.id)
    setDraft({
      name: course.name,
      level: course.level,
      cycleId: course.cycleId,
      headTeacher: course.headTeacher,
      students: course.students
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(createEmptyCourse(cycles))
  }

  const handleDelete = (id: number) => {
    removeCourse(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Cursos"
      description="Mantén actualizada la nómina de cursos, su ciclo asociado y profesor jefe para distribuir cargas correctamente."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Curso</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Niveles</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Ciclo</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Profesor jefe</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Alumnos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {courses.map((course) => {
                const cycleName = cycles.find((cycle) => cycle.id === course.cycleId)?.name ?? course.cycleId
                return (
                  <tr key={course.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">
                      <ul className="list-disc pl-4">
                        {course.level
                          .split(',')
                          .map((level) => level.trim())
                          .filter(Boolean)
                          .map((level) => (
                            <li key={level}>{level}</li>
                          ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">{cycleName}</td>
                    <td className="px-4 py-3">{course.headTeacher}</td>
                    <td className="px-4 py-3">{course.students}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-sm text-slate-500 transition hover:text-brand"
                          type="button"
                          onClick={() => handleEdit(course)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-rose-500 transition hover:text-rose-600"
                          type="button"
                          onClick={() => handleDelete(course.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay cursos registrados.
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
          <h2 className="text-lg font-semibold">{editingId ? 'Editar curso' : 'Nuevo curso'}</h2>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">Niveles asociados</span>
            <textarea
              value={draft.level}
              onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value }))}
              rows={2}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder="Ej: 1° Básico, 2° Básico"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Ciclo</span>
            <select
              value={draft.cycleId}
              onChange={(event) => setDraft((current) => ({ ...current, cycleId: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            >
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Profesor jefe</span>
            <input
              value={draft.headTeacher}
              onChange={(event) => setDraft((current) => ({ ...current, headTeacher: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Cantidad de alumnos</span>
            <input
              type="number"
              min={1}
              value={draft.students}
              onChange={(event) =>
                setDraft((current) => ({ ...current, students: Math.max(1, Number(event.target.value) || 1) }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Actualizar curso' : 'Guardar curso'}
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
