// Vista para administrar profesores: aplica las reglas sobre asignación por
// nivel, cursos permitidos y contratos.
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { fetchConfig } from '../../services/configService'
import {
  useSchedulerDataStore,
  type TeacherData,
  type CourseData,
  type SubjectType,
  DEFAULT_LEVEL_ID
} from '../../store/useSchedulerData'

interface TeacherDraft {
  name: string
  levelId: string
  subjectIds: number[]
  courseIds: number[]
  weeklyHours: number
  contractType: 'full-time' | 'part-time'
}

// Función que genera el borrador inicial para crear profesores.
function buildEmptyDraft(levelId: string, fullTimeHours: number): TeacherDraft {
  return {
    name: '',
    levelId,
    subjectIds: [],
    courseIds: [],
    weeklyHours: fullTimeHours,
    contractType: 'full-time'
  }
}

// Función que ajusta la lista de cursos según si la asignatura es especial.
function normaliseCourseIds(
  courseIds: number[],
  teachesSpecial: boolean,
  availableCourses: CourseData[]
): number[] {
  const validIds = Array.from(
    new Set(
      courseIds.filter((courseId) => availableCourses.some((course) => course.id === courseId))
    )
  )
  return teachesSpecial ? validIds : validIds.slice(0, 1)
}

// Componente que administra el catálogo de profesores y sus restricciones.
export function TeachersPage() {
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const subjectsData = useSchedulerDataStore((state) => state.subjects)
  const courses = useSchedulerDataStore((state) => state.courses)
  const levels = useSchedulerDataStore((state) => state.levels)
  const addTeacher = useSchedulerDataStore((state) => state.addTeacher)
  const updateTeacher = useSchedulerDataStore((state) => state.updateTeacher)
  const removeTeacher = useSchedulerDataStore((state) => state.removeTeacher)
  const loadFromServer = useSchedulerDataStore((state) => state.loadFromServer)

  const { data: config } = useQuery(['config'], fetchConfig)
  const fullTimeHours = Math.max(1, config?.fullTimeWeeklyHours ?? 38)

  const levelCourseMap = useMemo(() => {
    return levels.reduce<Map<string, CourseData[]>>((acc, level) => {
      acc.set(level.id, courses.filter((course) => course.levelId === level.id))
      return acc
    }, new Map())
  }, [courses, levels])

  const subjectTypeMap = useMemo(
    () => new Map<number, SubjectType>(subjectsData.map((subject) => [subject.id, subject.type])),
    [subjectsData]
  )

  const levelOptions = levels
  const defaultLevelId = useMemo(() => {
    const firstLevelWithCourses = levelOptions.find(
      (level) => (levelCourseMap.get(level.id)?.length ?? 0) > 0
    )
    return firstLevelWithCourses?.id ?? levelOptions[0]?.id ?? DEFAULT_LEVEL_ID
  }, [levelCourseMap, levelOptions])

  const [draft, setDraft] = useState<TeacherDraft>(() => buildEmptyDraft(defaultLevelId, fullTimeHours))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft((current) => {
      const availableCourses = levelCourseMap.get(current.levelId) ?? []
      const teachesSpecial = current.subjectIds.some((subjectId) => subjectTypeMap.get(subjectId) === 'Especial')
      return {
        ...current,
        courseIds: normaliseCourseIds(current.courseIds, teachesSpecial, availableCourses)
      }
    })
  }, [levelCourseMap, subjectTypeMap])

  useEffect(() => {
    setDraft((current) => {
      if (levels.some((level) => level.id === current.levelId)) {
        return current
      }
      return buildEmptyDraft(defaultLevelId, fullTimeHours)
    })
  }, [defaultLevelId, levels, fullTimeHours])

  useEffect(() => {
    setDraft((current) => {
      if (current.contractType === 'full-time') {
        return { ...current, weeklyHours: fullTimeHours }
      }
      return current
    })
  }, [fullTimeHours])

  useEffect(() => {
    void loadFromServer({ force: true })
  }, [loadFromServer])

  const availableCourses = levelCourseMap.get(draft.levelId) ?? []
  const availableSubjects = subjectsData.filter((subject) => subject.levelId === draft.levelId)
  const teachesSpecial = draft.subjectIds.some((subjectId) => subjectTypeMap.get(subjectId) === 'Especial')
  const selectedCourses = normaliseCourseIds(draft.courseIds, teachesSpecial, availableCourses)

  useEffect(() => {
    setDraft((current) => ({ ...current, courseIds: selectedCourses }))
  }, [teachesSpecial, availableCourses.length])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (draft.subjectIds.length === 0) {
      setError('Selecciona al menos una asignatura.')
      return
    }
    if (selectedCourses.length === 0) {
      setError('Selecciona al menos un curso.')
      return
    }

    const payload: Omit<TeacherData, 'id'> = {
      name: draft.name,
      levelId: draft.levelId,
      subjectIds: draft.subjectIds,
      courseIds: selectedCourses,
      weeklyHours: Math.max(1, Number(draft.weeklyHours) || 1),
      contractType: draft.contractType
    }

    const success = await (editingId
      ? updateTeacher(editingId, payload)
      : addTeacher(payload))
    if (!success) {
      setError('No fue posible guardar el profesor. Verifica los datos e intenta nuevamente.')
      return
    }

    setDraft(buildEmptyDraft(defaultLevelId, fullTimeHours))
    setEditingId(null)
    setError(null)
  }

  const handleEdit = (teacher: TeacherData) => {
    setEditingId(teacher.id)
    setDraft({
      name: teacher.name,
      levelId: teacher.levelId,
      subjectIds: teacher.subjectIds,
      courseIds: teacher.courseIds,
      weeklyHours: teacher.contractType === 'full-time' ? fullTimeHours : teacher.weeklyHours,
      contractType: teacher.contractType
    })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(buildEmptyDraft(defaultLevelId, fullTimeHours))
    setError(null)
  }

  const handleDelete = async (id: number) => {
    await removeTeacher(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  const handleLevelChange = (levelId: string) => {
    const available = levelCourseMap.get(levelId) ?? []
    const teaches = draft.subjectIds.some((subjectId) => subjectTypeMap.get(subjectId) === 'Especial')
    const nextCourseIds = normaliseCourseIds(draft.courseIds, teaches, available)
    const nextSubjects = draft.subjectIds.filter((subjectId) => {
      const subject = subjectsData.find((item) => item.id === subjectId)
      return subject?.levelId === levelId
    })
    setDraft((current) => ({
      ...current,
      levelId,
      subjectIds: nextSubjects,
      courseIds: nextCourseIds
    }))
  }

  const toggleSubject = (subjectId: number, checked: boolean) => {
    setDraft((current) => {
      const nextSubjectIds = checked
        ? Array.from(new Set([...current.subjectIds, subjectId]))
        : current.subjectIds.filter((id) => id !== subjectId)
      const available = levelCourseMap.get(current.levelId) ?? []
      const teaches = nextSubjectIds.some((id) => subjectTypeMap.get(id) === 'Especial')
      return {
        ...current,
        subjectIds: nextSubjectIds,
        courseIds: normaliseCourseIds(current.courseIds, teaches, available)
      }
    })
  }

  const toggleCourse = (courseId: number, checked: boolean) => {
    setDraft((current) => {
      const available = levelCourseMap.get(current.levelId) ?? []
      const teaches = current.subjectIds.some((subjectId) => subjectTypeMap.get(subjectId) === 'Especial')
      const nextCourseIds = checked
        ? normaliseCourseIds([...current.courseIds, courseId], teaches, available)
        : current.courseIds.filter((id) => id !== courseId)
      return {
        ...current,
        courseIds: normaliseCourseIds(nextCourseIds, teaches, available)
      }
    })
  }

  const hasCourses = courses.length > 0
  const subjectNameMap = new Map(subjectsData.map((subject) => [subject.id, subject.name]))
  const levelNameMap = new Map(levels.map((level) => [level.id, level.name]))

  return (
    <MaintenanceLayout
      title="Profesores"
      description="Gestiona docentes por nivel, asignaturas y cursos asignados para evitar conflictos."
    >
      {!hasCourses && (
        <div className="rounded border border-amber-400 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
          Debes crear al menos un curso antes de registrar profesores. Dirígete al mantenedor de cursos para continuar.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Asignaturas</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Cursos asignados</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Contrato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {teachers.map((teacher) => {
                const teacherCourses = teacher.courseIds
                  .map((courseId) => courses.find((course) => course.id === courseId)?.name)
                  .filter(Boolean)
                const levelName = levelNameMap.get(teacher.levelId) ?? teacher.levelId
                const subjectNames = teacher.subjectIds
                  .map((subjectId) => subjectNameMap.get(subjectId))
                  .filter(Boolean)
                const contractLabel = teacher.contractType === 'full-time' ? 'Tiempo completo' : 'Tiempo parcial'
                return (
                  <tr key={teacher.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{teacher.name}</td>
                    <td className="px-4 py-3">{levelName}</td>
                    <td className="px-4 py-3">
                      <ul className="list-disc pl-4">
                        {subjectNames.map((subject) => (
                          <li key={`${teacher.id}-${subject}`}>{subject}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      {teacherCourses.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {teacherCourses.map((courseName) => (
                            <li key={`${teacher.id}-${courseName}`}>{courseName}</li>
                          ))}
                        </ul>
                      ) : (
                        'Sin cursos'
                      )}
                    </td>
                    <td className="px-4 py-3">{contractLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-sm text-slate-500 transition hover:text-brand"
                          type="button"
                          onClick={() => handleEdit(teacher)}
                          disabled={!hasCourses}
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
                )
              })}
              {teachers.length === 0 && (
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
          <h2 className="text-lg font-semibold">{editingId ? 'Editar profesor' : 'Nuevo profesor'}</h2>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nombre</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              maxLength={50}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
              disabled={!hasCourses}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nivel</span>
            <select
              value={draft.levelId}
              onChange={(event) => handleLevelChange(event.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={!hasCourses}
            >
              {levelOptions.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-2 rounded border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Asignaturas que imparte
            </legend>
            {availableSubjects.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Agrega asignaturas para este nivel antes de asignarlas a los profesores.
              </p>
            )}
            {availableSubjects.map((subject) => (
              <label key={subject.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.subjectIds.includes(subject.id)}
                  onChange={(event) => toggleSubject(subject.id, event.target.checked)}
                  className="h-4 w-4"
                  disabled={!hasCourses}
                />
                <span>{subject.name}</span>
              </label>
            ))}
            {draft.subjectIds.length === 0 && availableSubjects.length > 0 && (
              <p className="text-xs text-rose-500">Selecciona al menos una asignatura.</p>
            )}
          </fieldset>
          <fieldset className="grid gap-2 rounded border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Cursos asignados
            </legend>
            {availableCourses.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No hay cursos registrados para el nivel seleccionado.
              </p>
            )}
            {availableCourses.map((course) => (
              <label key={course.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course.id)}
                  onChange={(event) => toggleCourse(course.id, event.target.checked)}
                  className="h-4 w-4"
                  disabled={!hasCourses}
                />
                <span>{course.name}</span>
              </label>
            ))}
            {!teachesSpecial && selectedCourses.length > 1 && (
              <p className="text-xs text-rose-500">
                Los docentes con asignaturas normales solo pueden tener un curso asignado.
              </p>
            )}
          </fieldset>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Tipo de contrato</span>
            <select
              value={draft.contractType}
              onChange={(event) => {
                const value = event.target.value as 'full-time' | 'part-time'
                setDraft((current) => ({
                  ...current,
                  contractType: value,
                  weeklyHours: value === 'full-time' ? fullTimeHours : current.weeklyHours
                }))
              }}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={!hasCourses}
            >
              <option value="full-time">Tiempo completo</option>
              <option value="part-time">Tiempo parcial</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Horas semanales</span>
            <input
              type="number"
              min={1}
              value={draft.weeklyHours}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contractType: current.contractType === 'full-time' ? 'part-time' : current.contractType,
                  weeklyHours: Math.max(1, Number(event.target.value) || 1)
                }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={!hasCourses}
            />
            {draft.contractType === 'full-time' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Los docentes de tiempo completo utilizan el valor configurado de {fullTimeHours} horas semanales.
              </p>
            )}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white"
              disabled={!hasCourses}
            >
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
