import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubjectType = 'Normal' | 'Especial'

export interface SubjectCycleLoad {
  cycleId: string
  weeklyBlocks: number
}

export interface LevelData {
  id: string
  name: string
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
  headTeacherId: number | null
  classroomId: number | null
}

export interface TeacherData {
  id: number
  name: string
  subjects: string[]
  levelId: string
  courseIds: number[]
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
      headTeacherId: 1,
      classroomId: 1
    },
    {
      id: 2,
      name: '3° Medio A',
      levelId: 'media',
      headTeacherId: 2,
      classroomId: 2
    }
  ],
  teachers: [
    {
      id: 1,
      name: 'Ana Torres',
      subjects: ['Lenguaje', 'Historia'],
      levelId: 'basico',
      courseIds: [1],
      weeklyHours: 38
    },
    {
      id: 2,
      name: 'Luis Gómez',
      subjects: ['Música'],
      levelId: 'media',
      courseIds: [2],
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
        set((state) => {
          const normalisedName = classroom.name.trim().toLowerCase()
          const exists = state.classrooms.some(
            (item) => item.name.trim().toLowerCase() === normalisedName
          )
          if (exists) {
            return state
          }
          return {
            classrooms: [{ id: Date.now(), ...classroom }, ...state.classrooms]
          }
        }),
      updateClassroom: (id, classroom) =>
        set((state) => {
          const normalisedName = classroom.name.trim().toLowerCase()
          const exists = state.classrooms.some(
            (item) => item.id !== id && item.name.trim().toLowerCase() === normalisedName
          )
          if (exists) {
            return state
          }
          return {
            classrooms: state.classrooms.map((item) => (item.id === id ? { id, ...classroom } : item))
          }
        }),
      removeClassroom: (id) =>
        set((state) => ({
          classrooms: state.classrooms.filter((classroom) => classroom.id !== id)
        })),
      addSubject: (subject) =>
        set((state) => {
          const levelIds = ensureSubjectLevels(subject.levelIds)
          const normalisedName = subject.name.trim().toLowerCase()
          const hasConflict = state.subjects.some((existing) => {
            if (existing.name.trim().toLowerCase() !== normalisedName) {
              return false
            }
            return existing.levelIds.some((levelId) => levelIds.includes(levelId))
          })
          if (hasConflict) {
            return state
          }
          return {
            subjects: [
              {
                id: Date.now(),
                ...subject,
                levelIds
              },
              ...state.subjects
            ]
          }
        }),
      updateSubject: (id, subject) =>
        set((state) => {
          const levelIds = ensureSubjectLevels(subject.levelIds)
          const normalisedName = subject.name.trim().toLowerCase()
          const hasConflict = state.subjects.some((existing) => {
            if (existing.id === id) {
              return false
            }
            if (existing.name.trim().toLowerCase() !== normalisedName) {
              return false
            }
            return existing.levelIds.some((levelId) => levelIds.includes(levelId))
          })
          if (hasConflict) {
            return state
          }
          return {
            subjects: state.subjects.map((item) =>
              item.id === id
                ? {
                    id,
                    ...subject,
                    levelIds
                  }
                : item
            )
          }
        }),
      removeSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id)
        })),
      addCourse: (course) =>
        set((state) => {
          const validLevelId = FIXED_LEVELS.some((level) => level.id === course.levelId)
            ? course.levelId
            : DEFAULT_LEVEL_ID
          if (
            course.classroomId !== null &&
            state.courses.some((existing) => existing.classroomId === course.classroomId)
          ) {
            return state
          }
          const newCourse = {
            id: Date.now(),
            ...course,
            levelId: validLevelId,
            headTeacherId: course.headTeacherId ?? null,
            classroomId: course.classroomId ?? null
          }
          return {
            courses: [newCourse, ...state.courses]
          }
        }),
      updateCourse: (id, course) =>
        set((state) => {
          const validLevelId = FIXED_LEVELS.some((level) => level.id === course.levelId)
            ? course.levelId
            : DEFAULT_LEVEL_ID
          if (
            course.classroomId !== null &&
            state.courses.some(
              (existing) => existing.id !== id && existing.classroomId === course.classroomId
            )
          ) {
            return state
          }
          const updatedCourses = state.courses.map((item) =>
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
          const coursesById = new Map(updatedCourses.map((item) => [item.id, item]))
          const updatedTeachers = state.teachers
            .map((teacher) => {
              if (!teacher.courseIds.includes(id)) {
                return teacher
              }
              const filteredCourseIds = teacher.courseIds.filter((courseId) => {
                const match = coursesById.get(courseId)
                return match?.levelId === validLevelId
              })
              const nextCourseIds = filteredCourseIds.length > 0 ? filteredCourseIds : [id]
              return {
                ...teacher,
                levelId: validLevelId,
                courseIds: Array.from(new Set(nextCourseIds))
              }
            })
            .filter((teacher) => teacher.courseIds.length > 0)

          return {
            courses: updatedCourses,
            teachers: updatedTeachers
          }
        }),
      removeCourse: (id) =>
        set((state) => {
          const remainingCourses = state.courses.filter((course) => course.id !== id)
          const coursesById = new Map(remainingCourses.map((course) => [course.id, course]))
          const teachers = state.teachers
            .map((teacher) => {
              const courseIds = teacher.courseIds.filter((courseId) => courseId !== id)
              if (courseIds.length === 0) {
                return null
              }
              const primaryCourse = coursesById.get(courseIds[0])
              return {
                ...teacher,
                courseIds,
                levelId: primaryCourse?.levelId ?? teacher.levelId
              }
            })
            .filter((teacher): teacher is TeacherData => Boolean(teacher))

          return {
            courses: remainingCourses,
            teachers
          }
        }),
      addTeacher: (teacher) =>
        set((state) => {
          const levelId = FIXED_LEVELS.some((level) => level.id === teacher.levelId)
            ? teacher.levelId
            : DEFAULT_LEVEL_ID
          const subjects = Array.from(
            new Set(teacher.subjects.map((subject) => subject.trim()).filter(Boolean))
          )
          const courseIds = Array.from(
            new Set(
              (teacher.courseIds ?? []).filter((courseId) => {
                const course = state.courses.find((item) => item.id === courseId)
                return course ? course.levelId === levelId : false
              })
            )
          )
          const subjectTypeMap = new Map(
            state.subjects.map((subject) => [subject.name.trim().toLowerCase(), subject.type])
          )
          const teachesSpecial = subjects.some(
            (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
          )
          const resolvedCourseIds = teachesSpecial ? courseIds : courseIds.slice(0, 1)
          if (!teacher.name.trim() || subjects.length === 0 || resolvedCourseIds.length === 0) {
            return state
          }
          return {
            teachers: [
              {
                id: Date.now(),
                name: teacher.name.slice(0, 50),
                subjects,
                levelId,
                courseIds: resolvedCourseIds,
                weeklyHours: Math.max(1, Number(teacher.weeklyHours) || 1)
              },
              ...state.teachers
            ]
          }
        }),
      updateTeacher: (id, teacher) =>
        set((state) => {
          const levelId = FIXED_LEVELS.some((level) => level.id === teacher.levelId)
            ? teacher.levelId
            : DEFAULT_LEVEL_ID
          const subjects = Array.from(
            new Set(teacher.subjects.map((subject) => subject.trim()).filter(Boolean))
          )
          const courseIds = Array.from(
            new Set(
              (teacher.courseIds ?? []).filter((courseId) => {
                const course = state.courses.find((item) => item.id === courseId)
                return course ? course.levelId === levelId : false
              })
            )
          )
          const subjectTypeMap = new Map(
            state.subjects.map((subject) => [subject.name.trim().toLowerCase(), subject.type])
          )
          const teachesSpecial = subjects.some(
            (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
          )
          const resolvedCourseIds = teachesSpecial ? courseIds : courseIds.slice(0, 1)
          if (!teacher.name.trim() || subjects.length === 0 || resolvedCourseIds.length === 0) {
            return state
          }
          return {
            teachers: state.teachers.map((item) =>
              item.id === id
                ? {
                    id,
                    name: teacher.name.slice(0, 50),
                    subjects,
                    levelId,
                    courseIds: resolvedCourseIds,
                    weeklyHours: Math.max(1, Number(teacher.weeklyHours) || 1)
                  }
                : item
            )
          }
        }),
      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((teacher) => teacher.id !== id)
        }))
    }),
    {
      name: 'scheduler-data-store',
      version: 7,
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
        const subjects: SubjectData[] = legacySubjects
          .map((subject: any, index: number) => {
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
          .filter((subject: SubjectData) => subject.name.trim().length > 0)

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

        const legacyCourses = Array.isArray(persistedState.courses) ? persistedState.courses : []
        const courses: CourseData[] = legacyCourses
          .map((course: any, index: number) => {
            const levelNames = normaliseList(course?.level)
            const levelId = levelNames.length > 0 ? ensureLevel(levelNames[0]) : DEFAULT_LEVEL_ID
            const headTeacherName = `${course?.headTeacher ?? ''}`.toLowerCase()

            return {
              id: course?.id ?? Date.now() + index,
              name: `${course?.name ?? 'Curso'}`.slice(0, 50),
              levelId,
              headTeacherId: null,
              classroomId:
                typeof course?.classroomId === 'number'
                  ? course.classroomId
                  : classrooms[0]?.id ?? defaultState.classrooms[0]?.id ?? null,
              _headTeacherLookup: headTeacherName
            } as CourseData & { _headTeacherLookup: string }
          })
          .map((course: CourseData & { _headTeacherLookup: string }) => {
            const { _headTeacherLookup, ...rest } = course
            return rest
          })

        const coursesById = new Map(courses.map((course) => [course.id, course]))
        const coursesByName = new Map(
          courses.map((course) => [course.name.toLowerCase(), course.id])
        )

        const subjectTypeMap = new Map(
          (subjects.length > 0 ? subjects : defaultState.subjects).map((subject) => [
            subject.name.trim().toLowerCase(),
            subject.type
          ])
        )

        const legacyTeachers = Array.isArray(persistedState.teachers) ? persistedState.teachers : []
        const teachers: TeacherData[] = legacyTeachers
          .map((teacher: any, index: number) => {
            const name = `${teacher?.name ?? 'Profesor'}`.slice(0, 50)
            const subjectNames = normaliseList(teacher?.subjects)
            if (subjectNames.length === 0) {
              return null
            }

            const levelId = ensureLevel(`${teacher?.levelId ?? teacher?.level ?? ''}`)

            const requestedCourseIds: number[] = []
            if (typeof teacher?.courseId === 'number') {
              requestedCourseIds.push(teacher.courseId)
            }
            if (Array.isArray(teacher?.courseIds)) {
              teacher.courseIds.forEach((value: any) => {
                if (typeof value === 'number') {
                  requestedCourseIds.push(value)
                }
              })
            }
            const byName = normaliseList(teacher?.courses ?? teacher?.course)
            byName.forEach((courseName) => {
              const matchId = coursesByName.get(courseName.toLowerCase())
              if (typeof matchId === 'number') {
                requestedCourseIds.push(matchId)
              }
            })

            let filteredCourseIds = Array.from(new Set(requestedCourseIds)).filter((courseId) =>
              coursesById.has(courseId)
            )
            if (filteredCourseIds.length === 0 && courses.length > 0) {
              filteredCourseIds = [courses[index % courses.length].id]
            }

            const primaryCourse = filteredCourseIds
              .map((courseId) => coursesById.get(courseId))
              .find((course) => course?.levelId === levelId)
            const resolvedLevelId = primaryCourse?.levelId ?? coursesById.get(filteredCourseIds[0])?.levelId ?? levelId

            const teachesSpecial = subjectNames.some(
              (subject) => subjectTypeMap.get(subject.toLowerCase()) === 'Especial'
            )
            const resolvedCourseIds = teachesSpecial
              ? filteredCourseIds
              : filteredCourseIds.slice(0, 1)

            return {
              id: teacher?.id ?? Date.now() + index,
              name,
              subjects: subjectNames,
              levelId: resolvedLevelId ?? DEFAULT_LEVEL_ID,
              courseIds: resolvedCourseIds,
              weeklyHours: Math.max(1, Number(teacher?.weeklyHours) || 1)
            }
          })
          .filter((teacher: TeacherData | null): teacher is TeacherData =>
            Boolean(teacher && teacher.courseIds.length > 0)
          )

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
export type { SubjectType }
