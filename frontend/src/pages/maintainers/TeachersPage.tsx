import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { fetchConfig, type CycleConfig } from '../../services/configService'
import {
  useSchedulerDataStore,
  type ContractType,
  type TeacherData,
  type CourseData,
  type LevelData
} from '../../store/useSchedulerData'

type TeacherDraft = Omit<TeacherData, 'id'>

const placeholderCycles: CycleConfig[] = [
  {
    id: 'ciclo-basico-i',
    name: 'Ciclo Básico I',
    levels: ['Parvulario', '1° Básico', '2° Básico', '3° Básico'],
    endTime: '13:00'
  },
  {
    id: 'ciclo-media',
    name: 'Ciclo Media',
    levels: ['Básico', 'Media'],
    endTime: '17:00'
  }
]

function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function resolveCycleForCourse(
  course: CourseData | undefined,
  levels: LevelData[],
  cycles: CycleConfig[]
): string {
  if (!course || cycles.length === 0) {
    return ''
  }

  const levelName = levels.find((level) => level.id === course.levelId)?.name ?? course.levelId
  const target = normalise(levelName)
  const matchedCycle = cycles.find((cycle) => cycle.levels.some((level) => normalise(level) === target))
  if (matchedCycle) {
    return matchedCycle.id
  }

  const fallback = cycles.find((cycle) =>
    cycle.levels.some((level) => {
      const normalisedLevel = normalise(level)
      return normalisedLevel.includes(target) || target.includes(normalisedLevel)
    })
  )

  return fallback?.id ?? cycles[0]?.id ?? ''
}

function createEmptyTeacher(
  cycles: CycleConfig[],
  courses: CourseData[],
  levels: LevelData[]
): TeacherDraft {
  const defaultCourse = courses[0]
  return {
    name: '',
    contractType: 'Completo',
    subjects: [],
    cycleId: resolveCycleForCourse(defaultCourse, levels, cycles),
    courseId: defaultCourse?.id ?? null,
    weeklyHours: 30
  }
}

export function TeachersPage() {
  const teachers = useSchedulerDataStore((state) => state.teachers)
  const subjectsData = useSchedulerDataStore((state) => state.subjects)
  const courses = useSchedulerDataStore((state) => state.courses)
  const levels = useSchedulerDataStore((state) => state.levels)
  const addTeacher = useSchedulerDataStore((state) => state.addTeacher)
  const updateTeacher = useSchedulerDataStore((state) => state.updateTeacher)
  const removeTeacher = useSchedulerDataStore((state) => state.removeTeacher)

  const { data: config } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: { cycles: placeholderCycles }
  })

  const cycles = config?.cycles ?? placeholderCycles
  const cycleNameMap = useMemo(() => new Map(cycles.map((cycle) => [cycle.id, cycle.name])), [cycles])
  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const [draft, setDraft] = useState<TeacherDraft>(() => createEmptyTeacher(cycles, courses, levels))
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    setDraft((current) => {
      const course = current.courseId ? courseMap.get(current.courseId) : courses[0]
      const cycleId = resolveCycleForCourse(course, levels, cycles)
      return {
        ...current,
        courseId: course?.id ?? null,
        cycleId
      }
    })
  }, [courses, courseMap, cycles, levels])

  const hasCourses = courses.length > 0
  const courseOptions = courses.map((course) => ({ id: course.id, name: course.name }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || draft.subjects.length === 0 || !draft.cycleId || !draft.courseId) {
      return
    }

    const payload: Omit<TeacherData, 'id'> = {
      name: draft.name,
      contractType: draft.contractType,
      subjects: draft.subjects,
      cycleId: draft.cycleId,
      courseId: draft.courseId,
      weeklyHours: draft.weeklyHours
    }

    if (editingId) {
      updateTeacher(editingId, payload)
    } else {
      addTeacher(payload)
    }

    setDraft(createEmptyTeacher(cycles, courses, levels))
    setEditingId(null)
  }

  const handleEdit = (teacher: TeacherData) => {
    setEditingId(teacher.id)
    setDraft({
      name: teacher.name,
      contractType: teacher.contractType,
      subjects: teacher.subjects,
      cycleId: teacher.cycleId,
      courseId: teacher.courseId,
      weeklyHours: teacher.weeklyHours
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(createEmptyTeacher(cycles, courses, levels))
  }

  const handleDelete = (id: number) => {
    removeTeacher(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  const handleCourseChange = (courseId: number | null) => {
    const course = courseId ? courseMap.get(courseId) : undefined
    const cycleId = resolveCycleForCourse(course, levels, cycles)
    setDraft((current) => ({
      ...current,
      courseId,
      cycleId
    }))
  }

  return (
    <MaintenanceLayout
      title="Profesores"
      description="Gestiona la disponibilidad de profesores, asignaturas y ciclos para evitar conflictos."
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
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Contrato</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Asignaturas</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Curso asignado</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Ciclo</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Horas</th>
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
                    {teacher.courseId ? courseMap.get(teacher.courseId)?.name ?? 'Curso no disponible' : 'Sin curso'}
                  </td>
                  <td className="px-4 py-3">{cycleNameMap.get(teacher.cycleId) ?? teacher.cycleId}</td>
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
              maxLength={50}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
              disabled={!hasCourses}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Tipo de contrato</span>
            <select
              value={draft.contractType}
              onChange={(event) => setDraft((current) => ({ ...current, contractType: event.target.value as ContractType }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={!hasCourses}
            >
              <option value="Completo">Completo</option>
              <option value="Parcial">Parcial</option>
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
                  onChange={(event) => {
                    const checked = event.target.checked
                    setDraft((current) => ({
                      ...current,
                      subjects: checked
                        ? Array.from(new Set([...current.subjects, subject.name]))
                        : current.subjects.filter((item) => item !== subject.name)
                    }))
                  }}
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
              Curso y ciclo asignados
            </legend>
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-300">Curso</span>
              <select
                value={draft.courseId ?? ''}
                onChange={(event) =>
                  handleCourseChange(event.target.value === '' ? null : Number(event.target.value))
                }
                className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                required
                disabled={!hasCourses}
              >
                <option value="" disabled>
                  Selecciona un curso
                </option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ciclo detectado:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {cycleNameMap.get(draft.cycleId) ?? 'Sin ciclo'}
              </span>
            </p>
          </fieldset>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Horas semanales</span>
            <input
              type="number"
              min={1}
              value={draft.weeklyHours}
              onChange={(event) =>
                setDraft((current) => ({ ...current, weeklyHours: Math.max(1, Number(event.target.value) || 1) }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={!hasCourses}
            />
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

