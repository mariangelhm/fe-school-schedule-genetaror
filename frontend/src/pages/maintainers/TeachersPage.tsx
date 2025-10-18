import { FormEvent, useEffect, useMemo, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import {
  useSchedulerDataStore,
  type TeacherData,
  type CourseData,
  DEFAULT_LEVEL_ID,
  type SubjectType
} from '../../store/useSchedulerData'

interface TeacherDraft {
  name: string
  levelId: string
  subjects: string[]
  courseIds: number[]
  weeklyHours: number
}

function buildEmptyDraft(levelId: string): TeacherDraft {
  return {
    name: '',
    levelId,
    subjects: [],
    courseIds: [],
    weeklyHours: 30
  }
}

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
  if (teachesSpecial) {
    return validIds
  }
  return validIds.slice(0, 1)
}

export function TeachersPage() {
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const subjectsData = useSchedulerDataStore((state) => state.subjects)
  const courses = useSchedulerDataStore((state) => state.courses)
  const levels = useSchedulerDataStore((state) => state.levels)
  const addTeacher = useSchedulerDataStore((state) => state.addTeacher)
  const updateTeacher = useSchedulerDataStore((state) => state.updateTeacher)
  const removeTeacher = useSchedulerDataStore((state) => state.removeTeacher)

  const levelCourseMap = useMemo(() => {
    return levels.reduce<Map<string, CourseData[]>>((acc, level) => {
      acc.set(level.id, courses.filter((course) => course.levelId === level.id))
      return acc
    }, new Map())
  }, [courses, levels])

  const subjectTypeMap = useMemo(
    () =>
      new Map<string, SubjectType>(
        subjectsData.map((subject) => [subject.name.trim().toLowerCase(), subject.type])
      ),
    [subjectsData]
  )

  const defaultLevelId = useMemo(() => {
    const firstLevelWithCourses = levels.find(
      (level) => (levelCourseMap.get(level.id)?.length ?? 0) > 0
    )
    return firstLevelWithCourses?.id ?? levels[0]?.id ?? DEFAULT_LEVEL_ID
  }, [levelCourseMap, levels])

  const [draft, setDraft] = useState<TeacherDraft>(() => buildEmptyDraft(defaultLevelId))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasCourses = courses.length > 0

  useEffect(() => {
    setDraft((current) => {
      const availableCourses = levelCourseMap.get(current.levelId) ?? []
      const teachesSpecial = current.subjects.some(
        (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
      )
      return {
        ...current,
        courseIds: normaliseCourseIds(current.courseIds, teachesSpecial, availableCourses)
      }
    })
  }, [courses, levelCourseMap, subjectTypeMap])

  useEffect(() => {
    setDraft((current) => {
      if (levels.some((level) => level.id === current.levelId)) {
        return current
      }
      return { ...current, levelId: defaultLevelId }
    })
  }, [defaultLevelId, levels])

  const availableCourses = levelCourseMap.get(draft.levelId) ?? []
  const levelOptions = levels
  const teachesSpecial = draft.subjects.some(
    (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
  )
  const selectedCourses = normaliseCourseIds(draft.courseIds, teachesSpecial, availableCourses)

  useEffect(() => {
    setDraft((current) => ({ ...current, courseIds: selectedCourses }))
  }, [teachesSpecial, availableCourses.length])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (draft.subjects.length === 0) {
      setError('Selecciona al menos una asignatura.')
      return
    }
    if (selectedCourses.length === 0) {
      setError('Selecciona al menos un curso.')
      return
    }

    const payload: Omit<TeacherData, 'id'> = {
      name: draft.name,
      subjects: draft.subjects,
      levelId: draft.levelId,
      courseIds: selectedCourses,
      weeklyHours: draft.weeklyHours
    }

    if (editingId) {
      updateTeacher(editingId, payload)
    } else {
      addTeacher(payload)
    }

    setDraft(buildEmptyDraft(defaultLevelId))
    setEditingId(null)
    setError(null)
  }

  const handleEdit = (teacher: TeacherData) => {
    setEditingId(teacher.id)
    setDraft({
      name: teacher.name,
      levelId: teacher.levelId,
      subjects: teacher.subjects,
      courseIds: teacher.courseIds,
      weeklyHours: teacher.weeklyHours
    })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(buildEmptyDraft(defaultLevelId))
    setError(null)
  }

  const handleDelete = (id: number) => {
    removeTeacher(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  const handleLevelChange = (levelId: string) => {
    const available = levelCourseMap.get(levelId) ?? []
    const teaches = draft.subjects.some(
      (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
    )
    const nextCourseIds = normaliseCourseIds(draft.courseIds, teaches, available)
    setDraft((current) => ({
      ...current,
      levelId,
      courseIds: nextCourseIds
    }))
  }

  const toggleSubject = (subjectName: string, checked: boolean) => {
    setDraft((current) => {
      const nextSubjects = checked
        ? Array.from(new Set([...current.subjects, subjectName]))
        : current.subjects.filter((subject) => subject !== subjectName)
      const teaches = nextSubjects.some(
        (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
      )
      const available = levelCourseMap.get(current.levelId) ?? []
      return {
        ...current,
        subjects: nextSubjects,
        courseIds: normaliseCourseIds(current.courseIds, teaches, available)
      }
    })
  }

  const toggleCourse = (courseId: number, checked: boolean) => {
    setDraft((current) => {
      const available = levelCourseMap.get(current.levelId) ?? []
      const teaches = current.subjects.some(
        (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
      )
      const nextCourseIds = checked
        ? normaliseCourseIds([...current.courseIds, courseId], teaches, available)
        : current.courseIds.filter((id) => id !== courseId)
      return {
        ...current,
        courseIds: normaliseCourseIds(nextCourseIds, teaches, available)
      }
    })
  }

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
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Horas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {teachers.map((teacher) => {
                const teacherCourses = teacher.courseIds
                  .map((courseId) => courses.find((course) => course.id === courseId)?.name)
                  .filter(Boolean)
                const levelName = levels.find((level) => level.id === teacher.levelId)?.name ?? teacher.levelId
                return (
                  <tr key={teacher.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3 font-medium">{teacher.name}</td>
                    <td className="px-4 py-3">{levelName}</td>
                    <td className="px-4 py-3">
                      <ul className="list-disc pl-4">
                        {teacher.subjects.map((subject) => (
                          <li key={subject}>{subject}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      {teacherCourses.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {teacherCourses.map((courseName) => (
                            <li key={courseName as string}>{courseName}</li>
                          ))}
                        </ul>
                      ) : (
                        'Sin cursos'
                      )}
                    </td>
                    <td className="px-4 py-3">{teacher.weeklyHours}</td>
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
            {subjectsData.map((subject) => (
              <label key={subject.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.subjects.includes(subject.name)}
                  onChange={(event) => toggleSubject(subject.name, event.target.checked)}
                  className="h-4 w-4"
                  disabled={!hasCourses}
                />
                <span>{subject.name}</span>
              </label>
            ))}
            {subjectsData.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Agrega asignaturas en el mantenedor correspondiente para poder asignarlas a los profesores.
              </p>
            )}
            {draft.subjects.length === 0 && subjectsData.length > 0 && (
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
            <span className="font-medium text-slate-600 dark:text-slate-300">Horas semanales</span>
            <input
              type="number"
              min={1}
              value={draft.weeklyHours}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  weeklyHours: Math.max(1, Number(event.target.value) || 1)
                }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={!hasCourses}
            />
          </label>
          {error && <p className="text-sm text-rose-500">{error}</p>}
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
