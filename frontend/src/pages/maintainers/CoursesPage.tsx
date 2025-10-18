import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { fetchConfig, type CycleConfig } from '../../services/configService'
import {
  useSchedulerDataStore,
  type CourseData,
  FIXED_LEVELS,
  DEFAULT_LEVEL_ID,
  type ClassroomData
} from '../../store/useSchedulerData'

type CourseDraft = Omit<CourseData, 'id'>

const placeholderCycles: CycleConfig[] = [
  {
    id: 'ciclo-basico-i',
    name: 'Ciclo Básico I',
    levels: ['1° Básico', '2° Básico', '3° Básico'],
    endTime: '13:00'
  }
]

function buildCourseDraft(
  cycles: CycleConfig[],
  levelId: string,
  classrooms: ClassroomData[]
): CourseDraft {
  return {
    name: '',
    levelId,
    cycleId: cycles[0]?.id ?? '',
    headTeacherId: null,
    classroomId: classrooms[0]?.id ?? null
  }
}

export function CoursesPage() {
  const courses = useSchedulerDataStore((state) => state.courses)
  const levels = useSchedulerDataStore((state) => state.levels)
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const classrooms = useSchedulerDataStore((state) => state.classrooms)
  const addCourse = useSchedulerDataStore((state) => state.addCourse)
  const updateCourse = useSchedulerDataStore((state) => state.updateCourse)
  const removeCourse = useSchedulerDataStore((state) => state.removeCourse)

  const { data: config } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: { cycles: placeholderCycles }
  })

  const cycles = config?.cycles ?? placeholderCycles
  const levelMap = useMemo(() => new Map(levels.map((level) => [level.id, level.name])), [levels])
  const defaultLevelId = levels[0]?.id ?? DEFAULT_LEVEL_ID
  const [draft, setDraft] = useState<CourseDraft>(() => buildCourseDraft(cycles, defaultLevelId, classrooms))
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    setDraft((current) => {
      const nextLevelId = FIXED_LEVELS.some((level) => level.id === current.levelId)
        ? current.levelId
        : defaultLevelId
      const availableClassrooms = classrooms.filter((classroom) => classroom.levelId === nextLevelId)
      const nextClassroomId = availableClassrooms.some((classroom) => classroom.id === current.classroomId)
        ? current.classroomId
        : availableClassrooms[0]?.id ?? null

      return {
        ...current,
        levelId: nextLevelId,
        cycleId:
          current.cycleId && cycles.some((cycle) => cycle.id === current.cycleId)
            ? current.cycleId
            : cycles[0]?.id ?? '',
        classroomId: nextClassroomId,
        headTeacherId:
          (nextLevelId === 'media' ? current.headTeacherId : null) ??
          (nextLevelId === 'media' && teachers.length > 0 ? teachers[0].id : null)
      }
    })
  }, [cycles, defaultLevelId, classrooms, teachers])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.levelId || !draft.cycleId || !draft.classroomId) {
      return
    }

    if (draft.levelId === 'media' && !draft.headTeacherId) {
      return
    }

    if (editingId) {
      updateCourse(editingId, draft)
    } else {
      addCourse(draft)
    }

    setDraft(buildCourseDraft(cycles, defaultLevelId, classrooms))
    setEditingId(null)
  }

  const handleEdit = (course: CourseData) => {
    setEditingId(course.id)
    setDraft({
      name: course.name,
      levelId: course.levelId,
      cycleId: course.cycleId,
      headTeacherId: course.headTeacherId,
      classroomId: course.classroomId
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(buildCourseDraft(cycles, defaultLevelId, classrooms))
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
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Ciclo</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Profesor jefe</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Aula</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {courses.map((course) => {
                const cycleName = cycles.find((cycle) => cycle.id === course.cycleId)?.name ?? course.cycleId
                const headTeacherName = teachers.find((teacher) => teacher.id === course.headTeacherId)?.name ?? 'Sin asignar'
                const classroomName = classrooms.find((classroom) => classroom.id === course.classroomId)?.name ?? 'Sin aula'
                return (
                  <tr key={course.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">{levelMap.get(course.levelId) ?? course.levelId}</td>
                    <td className="px-4 py-3">{cycleName}</td>
                    <td className="px-4 py-3">{course.levelId === 'media' ? headTeacherName : 'No aplica'}</td>
                    <td className="px-4 py-3">{classroomName}</td>
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
              required
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
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
          {draft.levelId === 'media' && (
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-300">Profesor jefe</span>
              <select
                value={draft.headTeacherId ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    headTeacherId: event.target.value === '' ? null : Number(event.target.value)
                  }))
                }
                className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                required
              >
                <option value="" disabled>
                  Selecciona un profesor
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <p className="text-xs text-rose-500">Necesitas registrar al menos un profesor antes de asignarlo.</p>
              )}
            </label>
          )}
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Aula</span>
            <select
              value={draft.classroomId ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  classroomId: event.target.value === '' ? null : Number(event.target.value)
                }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            >
              <option value="" disabled>
                Selecciona un aula
              </option>
              {classrooms
                .filter((classroom) => classroom.levelId === draft.levelId)
                .map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
            </select>
            {classrooms.filter((classroom) => classroom.levelId === draft.levelId).length === 0 && (
              <p className="text-xs text-rose-500">No existen aulas para este nivel. Regístralas antes de continuar.</p>
            )}
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
