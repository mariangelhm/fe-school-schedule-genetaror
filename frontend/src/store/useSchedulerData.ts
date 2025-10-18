import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubjectType = 'Normal' | 'Especial'

export interface LevelData {
  id: string
  name: string
}

export interface SubjectData {
  id: number
  name: string
  levelId: string
  weeklyBlocks: number
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
  subjectIds: number[]
  levelId: string
  courseIds: number[]
  weeklyHours: number
  contractType: TeacherContractType
}

export type TeacherContractType = 'full-time' | 'part-time'

interface SchedulerState {
  levels: LevelData[]
  classrooms: ClassroomData[]
  subjects: SubjectData[]
  courses: CourseData[]
  teachers: TeacherData[]
  addClassroom: (classroom: Omit<ClassroomData, 'id'>) => boolean
  removeClassroom: (id: number) => void
  updateClassroom: (id: number, classroom: Omit<ClassroomData, 'id'>) => boolean
  addSubject: (subject: Omit<SubjectData, 'id'>) => boolean
  removeSubject: (id: number) => void
  updateSubject: (id: number, subject: Omit<SubjectData, 'id'>) => boolean
  addCourse: (course: Omit<CourseData, 'id'>) => boolean
  removeCourse: (id: number) => void
  updateCourse: (id: number, course: Omit<CourseData, 'id'>) => boolean
  addTeacher: (teacher: Omit<TeacherData, 'id'>) => boolean
  removeTeacher: (id: number) => void
  updateTeacher: (id: number, teacher: Omit<TeacherData, 'id'>) => boolean
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
      levelId: 'basico',
      weeklyBlocks: 10,
      maxDailyBlocks: 2,
      type: 'Normal',
      color: '#2563eb'
    },
    {
      id: 2,
      name: 'Matemática',
      levelId: 'basico',
      weeklyBlocks: 9,
      maxDailyBlocks: 2,
      type: 'Normal',
      color: '#9333ea'
    },
    {
      id: 3,
      name: 'Música',
      levelId: 'media',
      weeklyBlocks: 4,
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
      subjectIds: [1],
      levelId: 'basico',
      courseIds: [1],
      weeklyHours: 38,
      contractType: 'full-time'
    },
    {
      id: 2,
      name: 'Luis Gómez',
      subjectIds: [3],
      levelId: 'media',
      courseIds: [2],
      weeklyHours: 18,
      contractType: 'part-time'
    }
  ]
}

export const useSchedulerDataStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      addClassroom: (classroom) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === classroom.levelId)
          ? classroom.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          const normalisedName = classroom.name.trim().toLowerCase()
          const exists = state.classrooms.some(
            (item) =>
              item.levelId === levelId && item.name.trim().toLowerCase() === normalisedName
          )
          if (exists) {
            return state
          }
          success = true
          return {
            classrooms: [
              { id: Date.now(), name: classroom.name.slice(0, 50), levelId },
              ...state.classrooms
            ]
          }
        })
        return success
      },
      updateClassroom: (id, classroom) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === classroom.levelId)
          ? classroom.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          const normalisedName = classroom.name.trim().toLowerCase()
          const exists = state.classrooms.some(
            (item) =>
              item.id !== id &&
              item.levelId === levelId &&
              item.name.trim().toLowerCase() === normalisedName
          )
          if (exists) {
            return state
          }
          success = true
          return {
            classrooms: state.classrooms.map((item) =>
              item.id === id ? { id, name: classroom.name.slice(0, 50), levelId } : item
            )
          }
        })
        return success
      },
      removeClassroom: (id) => {
        set((state) => ({
          classrooms: state.classrooms.filter((classroom) => classroom.id !== id),
          courses: state.courses.map((course) =>
            course.classroomId === id ? { ...course, classroomId: null } : course
          )
        }))
      },
      addSubject: (subject) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === subject.levelId)
          ? subject.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          const normalisedName = subject.name.trim().toLowerCase()
          const hasConflict = state.subjects.some(
            (existing) =>
              existing.levelId === levelId && existing.name.trim().toLowerCase() === normalisedName
          )
          if (hasConflict) {
            return state
          }
          success = true
          return {
            subjects: [
              {
                id: Date.now(),
                name: subject.name.slice(0, 50),
                levelId,
                weeklyBlocks: Math.max(1, Number(subject.weeklyBlocks) || 1),
                maxDailyBlocks: Math.max(1, Number(subject.maxDailyBlocks) || 1),
                type: subject.type,
                color: subject.color
              },
              ...state.subjects
            ]
          }
        })
        return success
      },
      updateSubject: (id, subject) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === subject.levelId)
          ? subject.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          const normalisedName = subject.name.trim().toLowerCase()
          const hasConflict = state.subjects.some(
            (existing) =>
              existing.id !== id &&
              existing.levelId === levelId &&
              existing.name.trim().toLowerCase() === normalisedName
          )
          if (hasConflict) {
            return state
          }
          success = true
          const updatedSubjects = state.subjects.map((item) =>
            item.id === id
              ? {
                  id,
                  name: subject.name.slice(0, 50),
                  levelId,
                  weeklyBlocks: Math.max(1, Number(subject.weeklyBlocks) || 1),
                  maxDailyBlocks: Math.max(1, Number(subject.maxDailyBlocks) || 1),
                  type: subject.type,
                  color: subject.color
                }
              : item
          )
          const remainingSubjectIds = new Set(updatedSubjects.map((item) => item.id))
          const updatedTeachers = state.teachers
            .map((teacher) => {
              const subjectIds = teacher.subjectIds.filter((subjectId) => remainingSubjectIds.has(subjectId))
              if (subjectIds.length === 0) {
                return null
              }
              return { ...teacher, subjectIds }
            })
            .filter((teacher: TeacherData | null): teacher is TeacherData => Boolean(teacher))
          return {
            subjects: updatedSubjects,
            teachers: updatedTeachers
          }
        })
        return success
      },
      removeSubject: (id) => {
        set((state) => {
          const subjects = state.subjects.filter((subject) => subject.id !== id)
          const subjectIds = new Set(subjects.map((subject) => subject.id))
          const teachers = state.teachers
            .map((teacher) => {
              const nextSubjectIds = teacher.subjectIds.filter((subjectId) => subjectIds.has(subjectId))
              if (nextSubjectIds.length === 0) {
                return null
              }
              return { ...teacher, subjectIds: nextSubjectIds }
            })
            .filter((teacher: TeacherData | null): teacher is TeacherData => Boolean(teacher))
          return { subjects, teachers }
        })
      },
      addCourse: (course) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === course.levelId)
          ? course.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          if (
            course.classroomId !== null &&
            state.courses.some((existing) => existing.classroomId === course.classroomId)
          ) {
            return state
          }
          success = true
          const newCourse: CourseData = {
            id: Date.now(),
            name: course.name.slice(0, 50),
            levelId,
            headTeacherId: course.headTeacherId ?? null,
            classroomId: course.classroomId ?? null
          }
          return {
            courses: [newCourse, ...state.courses]
          }
        })
        return success
      },
      updateCourse: (id, course) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === course.levelId)
          ? course.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          if (
            course.classroomId !== null &&
            state.courses.some(
              (existing) => existing.id !== id && existing.classroomId === course.classroomId
            )
          ) {
            return state
          }
          success = true
          const updatedCourses = state.courses.map((item) =>
            item.id === id
              ? {
                  id,
                  name: course.name.slice(0, 50),
                  levelId,
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
                return match?.levelId === levelId
              })
              const nextCourseIds = filteredCourseIds.length > 0 ? filteredCourseIds : [id]
              return {
                ...teacher,
                levelId,
                courseIds: Array.from(new Set(nextCourseIds))
              }
            })
            .filter((teacher) => teacher.courseIds.length > 0)
          return {
            courses: updatedCourses,
            teachers: updatedTeachers
          }
        })
        return success
      },
      removeCourse: (id) => {
        set((state) => {
          const remainingCourses = state.courses.filter((course) => course.id !== id)
          const coursesById = new Map(remainingCourses.map((course) => [course.id, course]))
          const teachers = state.teachers
            .map((teacher) => {
              const courseIds = teacher.courseIds.filter((courseId) => courseId !== id)
              if (courseIds.length === 0) {
                return null
              }
              const referenceCourse = coursesById.get(courseIds[0])
              return {
                ...teacher,
                courseIds,
                levelId: referenceCourse?.levelId ?? teacher.levelId
              }
            })
            .filter((teacher: TeacherData | null): teacher is TeacherData => Boolean(teacher))
          return {
            courses: remainingCourses,
            teachers
          }
        })
      },
      addTeacher: (teacher) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === teacher.levelId)
          ? teacher.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          const subjectMap = new Map(state.subjects.map((subject) => [subject.id, subject]))
          const subjectIds = Array.from(
            new Set(
              (teacher.subjectIds ?? []).filter((subjectId) => {
                const match = subjectMap.get(subjectId)
                return match ? match.levelId === levelId : false
              })
            )
          )
          const courseIds = Array.from(
            new Set(
              (teacher.courseIds ?? []).filter((courseId) => {
                const course = state.courses.find((item) => item.id === courseId)
                return course ? course.levelId === levelId : false
              })
            )
          )
          const teachesSpecial = subjectIds.some((subjectId) => subjectMap.get(subjectId)?.type === 'Especial')
          const resolvedCourseIds = teachesSpecial ? courseIds : courseIds.slice(0, 1)
          if (!teacher.name.trim() || subjectIds.length === 0 || resolvedCourseIds.length === 0) {
            return state
          }
          success = true
          return {
            teachers: [
              {
                id: Date.now(),
                name: teacher.name.slice(0, 50),
                subjectIds,
                levelId,
                courseIds: resolvedCourseIds,
                weeklyHours: Math.max(1, Number(teacher.weeklyHours) || 1),
                contractType: teacher.contractType
              },
              ...state.teachers
            ]
          }
        })
        return success
      },
      updateTeacher: (id, teacher) => {
        let success = false
        const levelId = FIXED_LEVELS.some((level) => level.id === teacher.levelId)
          ? teacher.levelId
          : DEFAULT_LEVEL_ID
        set((state) => {
          const subjectMap = new Map(state.subjects.map((subject) => [subject.id, subject]))
          const subjectIds = Array.from(
            new Set(
              (teacher.subjectIds ?? []).filter((subjectId) => {
                const match = subjectMap.get(subjectId)
                return match ? match.levelId === levelId : false
              })
            )
          )
          const courseIds = Array.from(
            new Set(
              (teacher.courseIds ?? []).filter((courseId) => {
                const course = state.courses.find((item) => item.id === courseId)
                return course ? course.levelId === levelId : false
              })
            )
          )
          const teachesSpecial = subjectIds.some((subjectId) => subjectMap.get(subjectId)?.type === 'Especial')
          const resolvedCourseIds = teachesSpecial ? courseIds : courseIds.slice(0, 1)
          if (!teacher.name.trim() || subjectIds.length === 0 || resolvedCourseIds.length === 0) {
            return state
          }
          success = true
          return {
            teachers: state.teachers.map((item) =>
              item.id === id
                ? {
                    id,
                    name: teacher.name.slice(0, 50),
                    subjectIds,
                    levelId,
                    courseIds: resolvedCourseIds,
                    weeklyHours: Math.max(1, Number(teacher.weeklyHours) || 1),
                    contractType: teacher.contractType
                  }
                : item
            )
          }
        })
        return success
      },
      removeTeacher: (id) => {
        set((state) => ({
          teachers: state.teachers.filter((teacher) => teacher.id !== id)
        }))
      }
    }),
    {
      name: 'scheduler-data-store',
      version: 8,
      migrate: (persistedState: any) => {
        if (!persistedState) {
          return persistedState as SchedulerState
        }

        try {
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
            const normalised = `${name ?? ''}`
              .toLowerCase()
              .normalize('NFD')
              .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
              .replace(/(^-|-$)/g, '')

            const match = FIXED_LEVELS.find(
              (level) => level.id === normalised || level.name.toLowerCase() === `${name ?? ''}`.toLowerCase()
            )
            return match?.id ?? DEFAULT_LEVEL_ID
          }

          const legacyClassrooms = Array.isArray(persistedState.classrooms) ? persistedState.classrooms : []
          const classroomsMap = new Map<string, ClassroomData>()
          legacyClassrooms.forEach((classroom: any, index: number) => {
            const levelId = FIXED_LEVELS.some((level) => level.id === classroom?.levelId)
              ? classroom.levelId
              : DEFAULT_LEVEL_ID
            const name = `${classroom?.name ?? 'Aula'}`.slice(0, 50)
            if (!name.trim()) {
              return
            }
            const key = `${levelId}|${name.toLowerCase()}`
            if (classroomsMap.has(key)) {
              return
            }
            classroomsMap.set(key, {
              id: classroom?.id ?? Date.now() + index,
              name,
              levelId
            })
          })
          const classrooms = classroomsMap.size > 0 ? Array.from(classroomsMap.values()) : defaultState.classrooms

          const legacySubjects = Array.isArray(persistedState.subjects) ? persistedState.subjects : []
          const subjects: SubjectData[] = []
          const subjectLookup = new Map<string, number>()

          legacySubjects.forEach((subject: any, index: number) => {
            const name = `${subject?.name ?? 'Asignatura'}`.slice(0, 50)
            if (!name.trim()) {
              return
            }

            const levelNames = normaliseList(subject?.level ?? subject?.levels)
            const levelIds = levelNames.length > 0 ? levelNames.map(ensureLevel) : [DEFAULT_LEVEL_ID]

            const cycleLoads = Array.isArray(subject?.cycleLoads)
              ? subject.cycleLoads
                  .map((load: any) => Math.max(0, Number(load?.weeklyBlocks) || 0))
                  .reduce((acc: number, value: number) => acc + value, 0)
              : Math.max(0, Number(subject?.weeklyBlocks) || 0)

            const weeklyBlocks = Math.max(1, cycleLoads || 4)
            const maxDailyBlocks = Math.max(1, Number(subject?.maxDailyBlocks) || 1)
            const type: SubjectType = subject?.type === 'Especial' ? 'Especial' : 'Normal'
            const color = `${subject?.color ?? '#2563eb'}`

            levelIds.forEach((levelId, offset) => {
              const id = (typeof subject?.id === 'number' ? subject.id : Date.now() + index) + offset
              const entry: SubjectData = {
                id,
                name,
                levelId,
                weeklyBlocks,
                maxDailyBlocks,
                type,
                color
              }
              const key = `${name.toLowerCase()}|${levelId}`
              if (!subjectLookup.has(key)) {
                subjectLookup.set(key, id)
                subjects.push(entry)
              }
            })
          })

          if (subjects.length === 0) {
            defaultState.subjects.forEach((subject) => {
              subjectLookup.set(`${subject.name.toLowerCase()}|${subject.levelId}`, subject.id)
            })
            subjects.push(...defaultState.subjects)
          }

          const legacyCourses = Array.isArray(persistedState.courses) ? persistedState.courses : []
          const courses: CourseData[] = legacyCourses.map((course: any, index: number) => {
            const levelNames = normaliseList(course?.level)
            const levelId = levelNames.length > 0 ? ensureLevel(levelNames[0]) : DEFAULT_LEVEL_ID
            const classroomId = typeof course?.classroomId === 'number' ? course.classroomId : null
            return {
              id: course?.id ?? Date.now() + index,
              name: `${course?.name ?? 'Curso'}`.slice(0, 50),
              levelId,
              headTeacherId: typeof course?.headTeacherId === 'number' ? course.headTeacherId : null,
              classroomId
            }
          })

          const courseById = new Map(courses.map((course) => [course.id, course]))
          const courseByName = new Map(courses.map((course) => [course.name.toLowerCase(), course.id]))

          const legacyTeachers = Array.isArray(persistedState.teachers) ? persistedState.teachers : []
          const teachers: TeacherData[] = legacyTeachers
            .map((teacher: any, index: number) => {
              const name = `${teacher?.name ?? 'Profesor'}`.slice(0, 50)
              const levelId = ensureLevel(`${teacher?.levelId ?? teacher?.level ?? ''}`)

              const subjectNames = normaliseList(teacher?.subjects ?? teacher?.subject)
              const subjectIds = subjectNames
                .map((subjectName) => {
                  const key = `${subjectName.toLowerCase()}|${levelId}`
                  if (subjectLookup.has(key)) {
                    return subjectLookup.get(key) as number
                  }
                  const anyLevelMatch = subjects.find(
                    (subject) => subject.name.toLowerCase() === subjectName.toLowerCase()
                  )
                  return anyLevelMatch?.id
                })
                .filter((id): id is number => typeof id === 'number')

              if (!name.trim() || subjectIds.length === 0) {
                return null
              }

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
              normaliseList(teacher?.courses).forEach((courseName) => {
                const matchId = courseByName.get(courseName.toLowerCase())
                if (typeof matchId === 'number') {
                  requestedCourseIds.push(matchId)
                }
              })

              const courseIds = Array.from(new Set(requestedCourseIds)).filter((courseId) => {
                const course = courseById.get(courseId)
                return course ? course.levelId === levelId : false
              })

              if (courseIds.length === 0 && courses.length > 0) {
                const fallback = courses.find((course) => course.levelId === levelId)
                if (fallback) {
                  courseIds.push(fallback.id)
                }
              }

              if (courseIds.length === 0) {
                return null
              }

              const subjectType = new Map(subjects.map((subject) => [subject.id, subject.type]))
              const teachesSpecial = subjectIds.some((subjectId) => subjectType.get(subjectId) === 'Especial')
              const resolvedCourseIds = teachesSpecial ? courseIds : courseIds.slice(0, 1)

              const weeklyHours = Math.max(1, Number(teacher?.weeklyHours) || 1)
              const contractType: TeacherContractType = weeklyHours >= 30 ? 'full-time' : 'part-time'

              return {
                id: teacher?.id ?? Date.now() + index,
                name,
                subjectIds,
                levelId,
                courseIds: resolvedCourseIds,
                weeklyHours,
                contractType
              }
            })
            .filter((teacher: TeacherData | null): teacher is TeacherData => Boolean(teacher))

          return {
            levels: FIXED_LEVELS,
            classrooms,
            subjects,
            courses: courses.length > 0 ? courses : defaultState.courses,
            teachers: teachers.length > 0 ? teachers : defaultState.teachers
          } as SchedulerState
        } catch (error) {
          console.warn('No fue posible migrar el estado anterior, se usarán valores por defecto.', error)
          return {
            levels: FIXED_LEVELS,
            classrooms: defaultState.classrooms,
            subjects: defaultState.subjects,
            courses: defaultState.courses,
            teachers: defaultState.teachers
          }
        }
      }
    }
  )
)
export type { SubjectType }
