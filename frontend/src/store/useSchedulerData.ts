import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubjectType = 'Normal' | 'Especial'
type ContractType = 'Completo' | 'Parcial'

export interface LevelData {
  id: string
  name: string
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

export interface ClassroomData {
  id: number
  name: string
  levelId: string
}

export interface CourseData {
  id: number
  name: string
  levelId: string
  cycleId: string
  headTeacherId: number | null
  classroomId: number | null
}

export interface TeacherData {
  id: number
  name: string
  contractType: ContractType
  subjects: string[]
  cycleId: string
  weeklyHours: number
}

interface SchedulerState {
  levels: LevelData[]
  classrooms: ClassroomData[]
  subjects: SubjectData[]
  courses: CourseData[]
  teachers: TeacherData[]
  addClassroom: (classroom: Omit<ClassroomData, 'id'>) => void
  removeClassroom: (id: number) => void
  updateClassroom: (id: number, classroom: Omit<ClassroomData, 'id'>) => void
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

export const FIXED_LEVELS: LevelData[] = [
  { id: 'parvulario', name: 'Parvulario' },
  { id: 'basico', name: 'Básico' },
  { id: 'media', name: 'Media' }
]

export const DEFAULT_LEVEL_ID = FIXED_LEVELS[0].id

const defaultState: Pick<SchedulerState, 'levels' | 'classrooms' | 'subjects' | 'courses' | 'teachers'> = {
  levels: FIXED_LEVELS,
  classrooms: [
    { id: 0, name: 'Sala Jardín', levelId: 'parvulario' },
    { id: 1, name: 'Sala 101', levelId: 'basico' },
    { id: 2, name: 'Sala Multimedia', levelId: 'media' }
  ],
  subjects: [
    {
      id: 1,
      name: 'Lenguaje',
      levelIds: ['basico'],
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
      levelIds: ['basico'],
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
      levelIds: ['parvulario', 'basico'],
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
      levelId: 'basico',
      cycleId: 'ciclo-basico-i',
      headTeacherId: 1,
      classroomId: 1
    },
    {
      id: 2,
      name: '3° Medio A',
      levelId: 'media',
      cycleId: 'ciclo-media',
      headTeacherId: 2,
      classroomId: 2
    }
  ],
  teachers: [
    {
      id: 1,
      name: 'Ana Torres',
      contractType: 'Completo',
      subjects: ['Lenguaje', 'Historia'],
      cycleId: 'ciclo-basico-i',
      weeklyHours: 38
    },
    {
      id: 2,
      name: 'Luis Gómez',
      contractType: 'Parcial',
      subjects: ['Música'],
      cycleId: 'ciclo-media',
      weeklyHours: 18
    }
  ]
}

function ensureSubjectLevels(levelIds: string[]): string[] {
  const unique = Array.from(
    new Set(levelIds.filter((levelId) => FIXED_LEVELS.some((level) => level.id === levelId)))
  )
  return unique.length > 0 ? unique : [DEFAULT_LEVEL_ID]
}

export const useSchedulerDataStore = create<SchedulerState>()(
  persist(
    (set) => ({
      ...defaultState,
      addClassroom: (classroom) =>
        set((state) => ({
          classrooms: [{ id: Date.now(), ...classroom }, ...state.classrooms]
        })),
      updateClassroom: (id, classroom) =>
        set((state) => ({
          classrooms: state.classrooms.map((item) => (item.id === id ? { id, ...classroom } : item))
        })),
      removeClassroom: (id) =>
        set((state) => ({
          classrooms: state.classrooms.filter((classroom) => classroom.id !== id)
        })),
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
          const validLevelId = FIXED_LEVELS.some((level) => level.id === course.levelId)
            ? course.levelId
            : DEFAULT_LEVEL_ID
          return {
            courses: [
              {
                id: Date.now(),
                ...course,
                levelId: validLevelId,
                headTeacherId: course.headTeacherId ?? null,
                classroomId: course.classroomId ?? null
              },
              ...state.courses
            ]
          }
        }),
      updateCourse: (id, course) =>
        set((state) => {
          const validLevelId = FIXED_LEVELS.some((level) => level.id === course.levelId)
            ? course.levelId
            : DEFAULT_LEVEL_ID
          return {
            courses: state.courses.map((item) =>
              item.id === id
                ? {
                    id,
                    ...course,
                    levelId: validLevelId,
                    headTeacherId: course.headTeacherId ?? null,
                    classroomId: course.classroomId ?? null
                  }
                : item
            )
          }
        }),
      removeCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== id)
        })),
      addTeacher: (teacher) =>
        set((state) => ({
          teachers: [
            {
              id: Date.now(),
              ...teacher,
              cycleId: teacher.cycleId
            },
            ...state.teachers
          ]
        })),
      updateTeacher: (id, teacher) =>
        set((state) => ({
          teachers: state.teachers.map((item) => (item.id === id ? { id, ...teacher, cycleId: teacher.cycleId } : item))
        })),
      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((teacher) => teacher.id !== id)
        }))
    }),
    {
      name: 'scheduler-data-store',
      version: 5,
      migrate: (persistedState: any) => {
        if (!persistedState) {
          return persistedState as SchedulerState
        }

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
          const slug = name
            .normalize('NFD')
            .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
            .replace(/(^-|-$)/g, '')
            .toLowerCase()

          const match = FIXED_LEVELS.find((level) => level.id === slug || level.name.toLowerCase() === name.toLowerCase())
          return match?.id ?? DEFAULT_LEVEL_ID
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
          const levelIds = levelNames.length > 0 ? levelNames.map(ensureLevel) : [DEFAULT_LEVEL_ID]

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

        const legacyClassrooms = Array.isArray(persistedState.classrooms) ? persistedState.classrooms : []
        const classrooms: ClassroomData[] = legacyClassrooms
          .map((classroom: any, index: number) => {
            const levelId = FIXED_LEVELS.some((level) => level.id === classroom?.levelId)
              ? classroom.levelId
              : DEFAULT_LEVEL_ID

            return {
              id: classroom?.id ?? Date.now() + index,
              name: `${classroom?.name ?? 'Aula'}`.slice(0, 50),
              levelId
            }
          })
          .filter((classroom: ClassroomData) => classroom.name.trim().length > 0)

        const legacyTeachers = Array.isArray(persistedState.teachers) ? persistedState.teachers : []
        const teachers: TeacherData[] = legacyTeachers.map((teacher: any, index: number) => {
          const subjects = normaliseList(teacher?.subjects)
          const cycleId = typeof teacher?.cycleId === 'string' && teacher.cycleId.trim().length > 0
            ? teacher.cycleId
            : Array.isArray(teacher?.cycles) && teacher.cycles.length > 0
            ? `${teacher.cycles[0]}`
            : defaultState.teachers[0].cycleId

          return {
            id: teacher?.id ?? Date.now() + index,
            name: `${teacher?.name ?? 'Profesor'}`.slice(0, 50),
            contractType: teacher?.contractType === 'Parcial' ? 'Parcial' : 'Completo',
            subjects,
            cycleId,
            weeklyHours: Math.max(0, Number(teacher?.weeklyHours) || 0)
          }
        })

        const teacherNameMap = new Map(
          teachers.map((teacher) => [teacher.name.toLowerCase(), teacher.id])
        )

        const legacyCourses = Array.isArray(persistedState.courses) ? persistedState.courses : []
        const courses: CourseData[] = legacyCourses.map((course: any, index: number) => {
          const levelNames = normaliseList(course?.level)
          const levelId = levelNames.length > 0 ? ensureLevel(levelNames[0]) : DEFAULT_LEVEL_ID
          const headTeacherId =
            typeof course?.headTeacherId === 'number'
              ? course.headTeacherId
              : (() => {
                  const teacherName = `${course?.headTeacher ?? ''}`.toLowerCase()
                  return teacherNameMap.get(teacherName) ?? null
                })()
          const classroomId = typeof course?.classroomId === 'number'
            ? course.classroomId
            : classrooms[0]?.id ?? defaultState.classrooms[0]?.id ?? null

          return {
            id: course?.id ?? Date.now() + index,
            name: `${course?.name ?? 'Curso'}`,
            levelId,
            cycleId: `${course?.cycleId ?? 'ciclo-basico-i'}`,
            headTeacherId,
            classroomId
          }
        })

        return {
          levels: FIXED_LEVELS,
          classrooms: classrooms.length > 0 ? classrooms : defaultState.classrooms,
          subjects: subjects.length > 0 ? subjects : defaultState.subjects,
          courses: courses.length > 0 ? courses : defaultState.courses,
          teachers: teachers.length > 0 ? teachers : defaultState.teachers
        } as SchedulerState
      }
    }
  )
)

export type { SubjectType, ContractType }
