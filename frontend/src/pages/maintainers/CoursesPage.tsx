// Vista de administración de cursos: vincula aulas exclusivas, niveles fijos y
// profesor jefe para Media.
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import {
  useSchedulerDataStore,
  type CourseData,
  FIXED_LEVELS,
  DEFAULT_LEVEL_ID,
  type ClassroomData
} from '../../store/useSchedulerData'

type CourseDraft = Omit<CourseData, 'id'>

// Función que arma el borrador inicial de un curso según su nivel.
function buildCourseDraft(levelId: string, classrooms: ClassroomData[]): CourseDraft {
  return {
    name: '',
    levelId,
    headTeacherId: null,
    classroomId: classrooms.find((classroom) => classroom.levelId === levelId)?.id ?? null
  }
}

// Componente que administra los cursos y sus relaciones con aulas y profesores jefes.
export function CoursesPage() {
  const courses = useSchedulerDataStore((state) => state.courses)
  const levels = useSchedulerDataStore((state) => state.levels)
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const classrooms = useSchedulerDataStore((state) => state.classrooms)
  const addCourse = useSchedulerDataStore((state) => state.addCourse)
  const updateCourse = useSchedulerDataStore((state) => state.updateCourse)
  const removeCourse = useSchedulerDataStore((state) => state.removeCourse)
  const loadFromServer = useSchedulerDataStore((state) => state.loadFromServer)

  useEffect(() => {
    void loadFromServer({ force: true })
  }, [loadFromServer])

  const levelMap = useMemo(() => new Map(levels.map((level) => [level.id, level.name])), [levels])
  const defaultLevelId = levels[0]?.id ?? DEFAULT_LEVEL_ID
  const [draft, setDraft] = useState<CourseDraft>(() => buildCourseDraft(defaultLevelId, classrooms))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.levelId === 'media'),
    [teachers]
  )

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
        classroomId: nextClassroomId,
        headTeacherId:
          (nextLevelId === 'media' ? current.headTeacherId : null) ??
          (nextLevelId === 'media' && mediaTeachers.length > 0 ? mediaTeachers[0].id : null)
      }
    })
  }, [defaultLevelId, classrooms, mediaTeachers])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.levelId || !draft.classroomId) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (draft.levelId === 'media' && !draft.headTeacherId) {
      setError('Los cursos de nivel medio requieren un profesor jefe asignado.')
      return
    }

    const classroomInUse = courses.some(
      (course) => course.id !== editingId && course.classroomId === draft.classroomId
    )
    if (classroomInUse) {
      setError('El aula seleccionada ya está asignada a otro curso.')
      return
    }

    const payload: Omit<CourseData, 'id'> = {
      name: draft.name,
      levelId: draft.levelId,
      headTeacherId: draft.levelId === 'media' ? draft.headTeacherId : null,
      classroomId: draft.classroomId
    }

    const success = await (editingId
      ? updateCourse(editingId, payload)
      : addCourse(payload))
    if (!success) {
      setError('El aula seleccionada ya está asignada a otro curso.')
      return
    }

    setDraft(buildCourseDraft(defaultLevelId, classrooms))
    setEditingId(null)
    setError(null)
  }

  const handleEdit = (course: CourseData) => {
    setEditingId(course.id)
    setDraft({
      name: course.name,
      levelId: course.levelId,
      headTeacherId: course.headTeacherId,
      classroomId: course.classroomId
    })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(buildCourseDraft(defaultLevelId, classrooms))
    setError(null)
  }

  const handleDelete = async (id: number) => {
    await removeCourse(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Cursos"
      description="Mantén actualizada la nómina de cursos, su nivel y profesor jefe para distribuir cargas correctamente."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Curso</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Profesor jefe</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Aula</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {courses.map((course) => {
                const headTeacherName = teachers.find((teacher) => teacher.id === course.headTeacherId)?.name ?? 'Sin asignar'
                const classroomName = classrooms.find((classroom) => classroom.id === course.classroomId)?.name ?? 'Sin aula'
                return (
                  <tr key={course.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">{levelMap.get(course.levelId) ?? course.levelId}</td>
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
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
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
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  levelId: event.target.value,
                  headTeacherId:
                    event.target.value === 'media'
                      ? current.headTeacherId
                      : null
                }))
              }
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
                  Selecciona un profesor jefe
                </option>
                {mediaTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {mediaTeachers.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Registra profesores de nivel medio para habilitar esta selección.
                </p>
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
          {error && <p className="text-sm text-rose-500">{error}</p>}
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
