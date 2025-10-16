import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubjectType = 'Normal' | 'Especial'
type ContractType = 'Completo' | 'Parcial'

export interface LevelData {
  id: string
  name: string
  description?: string
}

export interface SubjectCycleLoad {
  cycleId: string
  weeklyBlocks: number
}

export interface SubjectData {
  id: number
  name: string
  levelIds: string[]
  cycleLoads: SubjectCycleLoad[]
  maxDailyBlocks: number
  type: SubjectType
  color: string
}

export interface CourseData {
  id: number
  name: string
  levelId: string
  cycleId: string
  headTeacher: string
  students: number
}

export interface TeacherData {
  id: number
  name: string
  contractType: ContractType
  subjects: string[]
  cycles: string[]
  weeklyHours: number
  availableBlocks: string
}

interface SchedulerState {
  levels: LevelData[]
  subjects: SubjectData[]
  courses: CourseData[]
  teachers: TeacherData[]
  addLevel: (level: Omit<LevelData, 'id'>) => void
  updateLevel: (id: string, level: Omit<LevelData, 'id'>) => void
  removeLevel: (id: string) => void
  addSubject: (subject: Omit<SubjectData, 'id'>) => void
  removeSubject: (id: number) => void
  updateSubject: (id: number, subject: Omit<SubjectData, 'id'>) => void
  addCourse: (course: Omit<CourseData, 'id'>) => void
  removeCourse: (id: number) => void
  updateCourse: (id: number, course: Omit<CourseData, 'id'>) => void
  addTeacher: (teacher: Omit<TeacherData, 'id'>) => void
  removeTeacher: (id: number) => void
  updateTeacher: (id: number, teacher: Omit<TeacherData, 'id'>) => void
}

const GENERAL_LEVEL_ID = 'general'

const defaultLevels: LevelData[] = [
  { id: GENERAL_LEVEL_ID, name: 'General' },
  { id: 'nivel-1-basico', name: '1° Básico' },
  { id: 'nivel-2-basico', name: '2° Básico' },
  { id: 'nivel-3-basico', name: '3° Básico' },
  { id: 'nivel-4-basico', name: '4° Básico' },
  { id: 'nivel-5-basico', name: '5° Básico' }
]

const defaultState: Pick<SchedulerState, 'levels' | 'subjects' | 'courses' | 'teachers'> = {
  levels: defaultLevels,
  subjects: [
    {
      id: 1,
      name: 'Lenguaje',
      levelIds: ['nivel-1-basico', 'nivel-2-basico'],
      cycleLoads: [
        { cycleId: 'ciclo-basico-i', weeklyBlocks: 6 },
        { cycleId: 'ciclo-basico-ii', weeklyBlocks: 4 }
      ],
      maxDailyBlocks: 2,
      type: 'Normal',
      color: '#2563eb'
    },
    {
      id: 2,
      name: 'Matemática',
      levelIds: ['nivel-1-basico', 'nivel-2-basico'],
      cycleLoads: [
        { cycleId: 'ciclo-basico-i', weeklyBlocks: 5 },
        { cycleId: 'ciclo-basico-ii', weeklyBlocks: 4 }
      ],
      maxDailyBlocks: 2,
      type: 'Normal',
      color: '#9333ea'
    },
    {
      id: 3,
      name: 'Música',
      levelIds: [GENERAL_LEVEL_ID],
      cycleLoads: [
        { cycleId: 'ciclo-basico-i', weeklyBlocks: 2 },
        { cycleId: 'ciclo-basico-ii', weeklyBlocks: 2 }
      ],
      maxDailyBlocks: 1,
      type: 'Especial',
      color: '#eab308'
    }
  ],
  courses: [
    {
      id: 1,
      name: '1° Básico A',
      levelId: 'nivel-1-basico',
      cycleId: 'ciclo-basico-i',
      headTeacher: 'María López',
      students: 32
    },
    {
      id: 2,
      name: '2° Básico B',
      levelId: 'nivel-2-basico',
      cycleId: 'ciclo-basico-i',
      headTeacher: 'Carlos Rivas',
      students: 29
    }
  ],
  teachers: [
    {
      id: 1,
      name: 'Ana Torres',
      contractType: 'Completo',
      subjects: ['Lenguaje', 'Historia'],
      cycles: ['ciclo-basico-i', 'ciclo-basico-ii'],
      weeklyHours: 38,
      availableBlocks: 'Lun-Vie 08:00-16:00'
    },
    {
      id: 2,
      name: 'Luis Gómez',
      contractType: 'Parcial',
      subjects: ['Música'],
      cycles: ['ciclo-basico-i', 'ciclo-basico-ii'],
      weeklyHours: 18,
      availableBlocks: 'Mar-Jue 11:00-17:00'
    }
  ]
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
}

function createLevelId(name: string, existing: LevelData[]): string {
  const base = slugify(name) || `nivel-${Date.now()}`
  let candidate = base
  let counter = 1

  while (existing.some((level) => level.id === candidate)) {
    candidate = `${base}-${counter}`
    counter++
  }

  return candidate
}

function ensureSubjectLevels(levelIds: string[]): string[] {
  const unique = Array.from(new Set(levelIds.filter(Boolean)))
  return unique.length > 0 ? unique : [GENERAL_LEVEL_ID]
}

export const useSchedulerDataStore = create<SchedulerState>()(
  persist(
    (set) => ({
      ...defaultState,
      addLevel: (level) =>
        set((state) => {
          const id = createLevelId(level.name, state.levels)
          return {
            levels: [{ id, ...level }, ...state.levels]
          }
        }),
      updateLevel: (id, level) =>
        set((state) => ({
          levels: state.levels.map((item) => (item.id === id ? { id, ...level } : item))
        })),
      removeLevel: (id) =>
        set((state) => {
          if (id === GENERAL_LEVEL_ID) {
            return state
          }

          const remainingLevels = state.levels.filter((level) => level.id !== id)
          return {
            levels: remainingLevels,
            courses: state.courses.map((course) => ({
              ...course,
              levelId: course.levelId === id ? GENERAL_LEVEL_ID : course.levelId
            })),
            subjects: state.subjects.map((subject) => {
              const nextLevelIds = subject.levelIds.filter((levelId) => levelId !== id)
              return { ...subject, levelIds: ensureSubjectLevels(nextLevelIds) }
            })
          }
        }),
      addSubject: (subject) =>
        set((state) => ({
          subjects: [{ id: Date.now(), ...subject, levelIds: ensureSubjectLevels(subject.levelIds) }, ...state.subjects]
        })),
      updateSubject: (id, subject) =>
        set((state) => ({
          subjects: state.subjects.map((item) =>
            item.id === id ? { id, ...subject, levelIds: ensureSubjectLevels(subject.levelIds) } : item
          )
        })),
      removeSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id)
        })),
      addCourse: (course) =>
        set((state) => {
          const validLevelId = state.levels.some((level) => level.id === course.levelId)
            ? course.levelId
            : GENERAL_LEVEL_ID
          return {
            courses: [{ id: Date.now(), ...course, levelId: validLevelId }, ...state.courses]
          }
        }),
      updateCourse: (id, course) =>
        set((state) => {
          const validLevelId = state.levels.some((level) => level.id === course.levelId)
            ? course.levelId
            : GENERAL_LEVEL_ID
          return {
            courses: state.courses.map((item) => (item.id === id ? { id, ...course, levelId: validLevelId } : item))
          }
        }),
      removeCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== id)
        })),
      addTeacher: (teacher) =>
        set((state) => ({
          teachers: [{ id: Date.now(), ...teacher }, ...state.teachers]
        })),
      updateTeacher: (id, teacher) =>
        set((state) => ({
          teachers: state.teachers.map((item) => (item.id === id ? { id, ...teacher } : item))
        })),
      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((teacher) => teacher.id !== id)
        }))
    }),
    {
      name: 'scheduler-data-store',
      version: 3,
      migrate: (persistedState: any, version) => {
        if (!persistedState) {
          return persistedState as SchedulerState
        }

        if (version >= 3) {
          return {
            ...persistedState,
            levels:
              Array.isArray(persistedState.levels) && persistedState.levels.length > 0
                ? persistedState.levels
                : defaultState.levels
          } as SchedulerState
        }

        const levelMap = new Map<string, LevelData>()
        defaultLevels.forEach((level) => levelMap.set(level.id, level))

        const normaliseList = (input: unknown): string[] => {
          if (Array.isArray(input)) {
            return input.map((item) => `${item}`.trim()).filter(Boolean)
          }
          if (typeof input === 'string') {
            return input
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          }
          return []
        }

        const ensureLevel = (name: string): string => {
          const trimmed = name.trim()
          if (!trimmed) {
            return GENERAL_LEVEL_ID
          }
          const slug = slugify(trimmed) || GENERAL_LEVEL_ID
          if (!levelMap.has(slug)) {
            levelMap.set(slug, { id: slug, name: trimmed })
          }
          return slug
        }

        const ensureCycleLoads = (subject: any): SubjectCycleLoad[] => {
          if (Array.isArray(subject?.cycleLoads)) {
            return subject.cycleLoads
              .map((load: any) => ({
                cycleId: `${load.cycleId ?? ''}`,
                weeklyBlocks: Math.max(0, Number(load.weeklyBlocks) || 0)
              }))
              .filter((load: SubjectCycleLoad) => load.cycleId)
          }

          const fallback = Math.max(0, Number(subject?.weeklyBlocks) || 0)
          if (fallback === 0) {
            return defaultState.subjects[0].cycleLoads
          }
          return [
            { cycleId: 'ciclo-basico-i', weeklyBlocks: fallback },
            { cycleId: 'ciclo-basico-ii', weeklyBlocks: fallback }
          ]
        }

        const legacySubjects = Array.isArray(persistedState.subjects) ? persistedState.subjects : []
        const subjects: SubjectData[] = legacySubjects.map((subject: any, index: number) => {
          const levelNames = normaliseList(subject?.level)
          const levelIds = levelNames.length > 0 ? levelNames.map(ensureLevel) : [GENERAL_LEVEL_ID]

          return {
            id: subject?.id ?? Date.now() + index,
            name: `${subject?.name ?? 'Asignatura'}`,
            levelIds: ensureSubjectLevels(levelIds),
            cycleLoads: ensureCycleLoads(subject),
            maxDailyBlocks: Math.max(1, Number(subject?.maxDailyBlocks) || 1),
            type: subject?.type === 'Especial' ? 'Especial' : 'Normal',
            color: `${subject?.color ?? '#2563eb'}`
          }
        })

        const legacyCourses = Array.isArray(persistedState.courses) ? persistedState.courses : []
        const courses: CourseData[] = legacyCourses.map((course: any, index: number) => {
          const levelNames = normaliseList(course?.level)
          const levelId = levelNames.length > 0 ? ensureLevel(levelNames[0]) : GENERAL_LEVEL_ID

          return {
            id: course?.id ?? Date.now() + index,
            name: `${course?.name ?? 'Curso'}`,
            levelId,
            cycleId: `${course?.cycleId ?? 'ciclo-basico-i'}`,
            headTeacher: `${course?.headTeacher ?? ''}`,
            students: Math.max(0, Number(course?.students) || 0)
          }
        })

        const legacyTeachers = Array.isArray(persistedState.teachers) ? persistedState.teachers : []
        const teachers: TeacherData[] = legacyTeachers.map((teacher: any, index: number) => ({
          id: teacher?.id ?? Date.now() + index,
          name: `${teacher?.name ?? 'Profesor'}`,
          contractType: teacher?.contractType === 'Parcial' ? 'Parcial' : 'Completo',
          subjects: normaliseList(teacher?.subjects),
          cycles: Array.isArray(teacher?.cycles)
            ? teacher.cycles.map((cycle: any) => `${cycle}`)
            : ['ciclo-basico-i', 'ciclo-basico-ii'],
          weeklyHours: Math.max(0, Number(teacher?.weeklyHours) || 0),
          availableBlocks: `${teacher?.availableBlocks ?? ''}`
        }))

        return {
          levels: Array.from(levelMap.values()),
          subjects: subjects.length > 0 ? subjects : defaultState.subjects,
          courses: courses.length > 0 ? courses : defaultState.courses,
          teachers: teachers.length > 0 ? teachers : defaultState.teachers
        } as SchedulerState
      }
    }
  )
)

export type { SubjectType, ContractType }
