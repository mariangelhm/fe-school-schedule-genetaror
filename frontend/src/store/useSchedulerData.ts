// Este store de Zustand concentra los datos maestros (aulas, asignaturas,
// cursos y profesores) y garantiza las reglas de negocio exigidas por el
// generador de horarios.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createClassroom as apiCreateClassroom,
  deleteClassroom as apiDeleteClassroom,
  listClassrooms as apiListClassrooms,
  updateClassroom as apiUpdateClassroom,
  type ClassroomResponse
} from '../services/classroomService'
import {
  createCourse as apiCreateCourse,
  deleteCourse as apiDeleteCourse,
  listCourses as apiListCourses,
  updateCourse as apiUpdateCourse,
  type CourseResponse
} from '../services/courseService'
import {
  createSubject as apiCreateSubject,
  deleteSubject as apiDeleteSubject,
  listSubjects as apiListSubjects,
  updateSubject as apiUpdateSubject,
  type SubjectPreferredTime as ApiSubjectPreferredTime,
  type SubjectResponse,
  type SubjectType as ApiSubjectType
} from '../services/subjectService'
import {
  createTeacher as apiCreateTeacher,
  deleteTeacher as apiDeleteTeacher,
  listTeachers as apiListTeachers,
  updateTeacher as apiUpdateTeacher,
  type TeacherContractType as ApiTeacherContractType,
  type TeacherResponse
} from '../services/teacherService'

type SchedulerResource = 'classrooms' | 'subjects' | 'courses' | 'teachers'

const ALL_RESOURCES: SchedulerResource[] = ['classrooms', 'subjects', 'courses', 'teachers']

type ResourceResponseMap = {
  classrooms: ClassroomResponse
  subjects: SubjectResponse
  courses: CourseResponse
  teachers: TeacherResponse
}

type ResourceStatus = {
  loading: boolean
  error: string | null
}

const RESOURCE_ERROR_MESSAGES: Record<SchedulerResource, string> = {
  classrooms: 'No fue posible cargar las aulas. Intenta nuevamente.',
  subjects: 'No fue posible cargar las asignaturas. Intenta nuevamente.',
  courses: 'No fue posible cargar los cursos. Intenta nuevamente.',
  teachers: 'No fue posible cargar los profesores. Intenta nuevamente.'
}

function createDefaultLoadedResources(): Record<SchedulerResource, boolean> {
  return {
    classrooms: false,
    subjects: false,
    courses: false,
    teachers: false
  }
}

function createDefaultResourceStatus(): Record<SchedulerResource, ResourceStatus> {
  return {
    classrooms: { loading: false, error: null },
    subjects: { loading: false, error: null },
    courses: { loading: false, error: null },
    teachers: { loading: false, error: null }
  }
}

export type SubjectType = ApiSubjectType
export type SubjectPreferredTime = ApiSubjectPreferredTime

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
  preferredTime: SubjectPreferredTime
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

export type TeacherContractType = ApiTeacherContractType

interface SchedulerState {
  levels: LevelData[]
  classrooms: ClassroomData[]
  subjects: SubjectData[]
  courses: CourseData[]
  teachers: TeacherData[]
  hasLoadedFromServer: boolean
  loadedResources: Record<SchedulerResource, boolean>
  resourceStatus: Record<SchedulerResource, ResourceStatus>
  loadFromServer: (options?: { force?: boolean; resources?: SchedulerResource[] }) => Promise<void>
  addClassroom: (classroom: Omit<ClassroomData, 'id'>) => Promise<boolean>
  removeClassroom: (id: number) => Promise<void>
  updateClassroom: (id: number, classroom: Omit<ClassroomData, 'id'>) => Promise<boolean>
  addSubject: (subject: Omit<SubjectData, 'id'>) => Promise<boolean>
  removeSubject: (id: number) => Promise<void>
  updateSubject: (id: number, subject: Omit<SubjectData, 'id'>) => Promise<boolean>
  addCourse: (course: Omit<CourseData, 'id'>) => Promise<boolean>
  removeCourse: (id: number) => Promise<void>
  updateCourse: (id: number, course: Omit<CourseData, 'id'>) => Promise<boolean>
  addTeacher: (teacher: Omit<TeacherData, 'id'>) => Promise<boolean>
  removeTeacher: (id: number) => Promise<void>
  updateTeacher: (id: number, teacher: Omit<TeacherData, 'id'>) => Promise<boolean>
}

export const FIXED_LEVELS: LevelData[] = [
  { id: 'parvulario', name: 'Parvulario' },
  { id: 'basico', name: 'Básico' },
  { id: 'media', name: 'Media' }
]

export const DEFAULT_LEVEL_ID = FIXED_LEVELS[0].id

function normaliseLevelId(levelId: string): string {
  return FIXED_LEVELS.some((level) => level.id === levelId) ? levelId : DEFAULT_LEVEL_ID
}

function mapClassroomResponse(response: ClassroomResponse): ClassroomData {
  return {
    id: Number(response.id),
    name: response.name,
    levelId: normaliseLevelId(response.levelId)
  }
}

function mapSubjectResponse(response: SubjectResponse): SubjectData {
  return {
    id: Number(response.id),
    name: response.name,
    levelId: normaliseLevelId(response.levelId),
    weeklyBlocks: Math.max(1, Number(response.weeklyBlocks) || 1),
    maxDailyBlocks: Math.max(1, Number(response.maxDailyBlocks) || 1),
    type: response.type,
    color: response.color,
    preferredTime: response.preferredTime
  }
}

function mapCourseResponse(response: CourseResponse): CourseData {
  return {
    id: Number(response.id),
    name: response.name,
    levelId: normaliseLevelId(response.levelId),
    headTeacherId: typeof response.headTeacherId === 'number' ? response.headTeacherId : null,
    classroomId: typeof response.classroomId === 'number' ? response.classroomId : null
  }
}

function mapTeacherResponse(response: TeacherResponse): TeacherData {
  const levelId = normaliseLevelId(response.levelId)
  const subjectIds = Array.isArray(response.subjectIds)
    ? Array.from(new Set(response.subjectIds.map((value) => Number(value)))).filter((value) => !Number.isNaN(value))
    : []
  const courseIds = Array.isArray(response.courseIds)
    ? Array.from(new Set(response.courseIds.map((value) => Number(value)))).filter((value) => !Number.isNaN(value))
    : []
  return {
    id: Number(response.id),
    name: response.name,
    subjectIds,
    levelId,
    courseIds,
    weeklyHours: Math.max(1, Number(response.weeklyHours) || 1),
    contractType: response.contractType
  }
}

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
      color: '#2563eb',
      preferredTime: 'morning'
    },
    {
      id: 2,
      name: 'Matemática',
      levelId: 'basico',
      weeklyBlocks: 9,
      maxDailyBlocks: 2,
      type: 'Normal',
      color: '#9333ea',
      preferredTime: 'morning'
    },
    {
      id: 3,
      name: 'Música',
      levelId: 'media',
      weeklyBlocks: 4,
      maxDailyBlocks: 1,
      type: 'Especial',
      color: '#eab308',
      preferredTime: 'afternoon'
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
      hasLoadedFromServer: false,
      loadedResources: createDefaultLoadedResources(),
      resourceStatus: createDefaultResourceStatus(),
      loadFromServer: async (options) => {
        const requested = options?.resources?.length ? options.resources : ALL_RESOURCES
        const uniqueResources = Array.from(new Set(requested))
        const { loadedResources } = get()
        const resourcesToLoad = options?.force
          ? uniqueResources
          : uniqueResources.filter((resource) => !loadedResources[resource])

        if (resourcesToLoad.length === 0) {
          return
        }

        set((state) => {
          const nextStatus = { ...state.resourceStatus }
          resourcesToLoad.forEach((resource) => {
            nextStatus[resource] = { loading: true, error: null }
          })
          return { resourceStatus: nextStatus }
        })

        const fetchers: {
          [K in SchedulerResource]: () => Promise<ResourceResponseMap[K][]>
        } = {
          classrooms: apiListClassrooms,
          subjects: apiListSubjects,
          courses: apiListCourses,
          teachers: apiListTeachers
        }

        const settled = await Promise.allSettled(
          resourcesToLoad.map(async (resource) => {
            const data = await fetchers[resource]()
            return { resource, data }
          })
        )

        settled.forEach((result, index) => {
          if (result.status === 'rejected') {
            const resource = resourcesToLoad[index]
            console.error(`No fue posible sincronizar el recurso ${resource}`, result.reason)
          }
        })

        set((state) => {
          const nextLoaded = { ...state.loadedResources }
          const nextStatus = { ...state.resourceStatus }
          const updates: Partial<SchedulerState> = {}

          settled.forEach((result, index) => {
            const resource = resourcesToLoad[index]
            if (!resource) {
              return
            }

            if (result.status === 'fulfilled') {
              nextLoaded[resource] = true
              nextStatus[resource] = { loading: false, error: null }
              switch (resource) {
                case 'classrooms':
                  updates.classrooms = (result.value.data as ClassroomResponse[]).map(mapClassroomResponse)
                  break
                case 'subjects':
                  updates.subjects = (result.value.data as SubjectResponse[]).map(mapSubjectResponse)
                  break
                case 'courses':
                  updates.courses = (result.value.data as CourseResponse[]).map(mapCourseResponse)
                  break
                case 'teachers':
                  updates.teachers = (result.value.data as TeacherResponse[]).map(mapTeacherResponse)
                  break
              }
            } else {
              nextLoaded[resource] = false
              nextStatus[resource] = {
                loading: false,
                error: RESOURCE_ERROR_MESSAGES[resource]
              }
            }
          })

          const hasLoadedFromServer = ALL_RESOURCES.every((resource) => nextLoaded[resource])

          return {
            ...updates,
            loadedResources: nextLoaded,
            resourceStatus: nextStatus,
            hasLoadedFromServer
          }
        })
      },
      // Método que agrega un aula nueva asegurando que no exista otra con el mismo nombre en el nivel.
      addClassroom: async (classroom) => {
        const levelId = normaliseLevelId(classroom.levelId)
        const name = classroom.name.slice(0, 50)
        const normalisedName = name.trim().toLowerCase()
        const exists = get().classrooms.some(
          (item) => item.levelId === levelId && item.name.trim().toLowerCase() === normalisedName
        )
        if (exists || !name.trim()) {
          return false
        }
        try {
          const created = await apiCreateClassroom({ name, levelId })
          const mapped = mapClassroomResponse(created)
          set((state) => ({ classrooms: [mapped, ...state.classrooms] }))
          await get().loadFromServer({ force: true, resources: ['classrooms'] })
          return true
        } catch (error) {
          console.error('No fue posible crear el aula', error)
          return false
        }
      },
      // Método que actualiza un aula y mantiene la unicidad por nombre y nivel.
      updateClassroom: async (id, classroom) => {
        const levelId = normaliseLevelId(classroom.levelId)
        const name = classroom.name.slice(0, 50)
        const normalisedName = name.trim().toLowerCase()
        const exists = get().classrooms.some(
          (item) =>
            item.id !== id &&
            item.levelId === levelId &&
            item.name.trim().toLowerCase() === normalisedName
        )
        if (exists || !name.trim()) {
          return false
        }
        try {
          const updated = await apiUpdateClassroom(id, { name, levelId })
          const mapped = mapClassroomResponse(updated)
          set((state) => ({
            classrooms: state.classrooms.map((item) => (item.id === id ? mapped : item))
          }))
          return true
        } catch (error) {
          console.error('No fue posible actualizar el aula', error)
          return false
        }
      },
      // Método que elimina un aula y limpia su referencia en los cursos asociados.
      removeClassroom: async (id) => {
        try {
          await apiDeleteClassroom(id)
          set((state) => ({
            classrooms: state.classrooms.filter((classroom) => classroom.id !== id),
            courses: state.courses.map((course) =>
              course.classroomId === id ? { ...course, classroomId: null } : course
            )
          }))
        } catch (error) {
          console.error('No fue posible eliminar el aula', error)
        }
      },
      // Método que registra una asignatura nueva validando duplicados por nivel.
      addSubject: async (subject) => {
        const levelId = normaliseLevelId(subject.levelId)
        const name = subject.name.slice(0, 50)
        const weeklyBlocks = Math.max(1, Number(subject.weeklyBlocks) || 1)
        const maxDailyBlocks = Math.max(1, Number(subject.maxDailyBlocks) || 1)
        const preferredTime: SubjectPreferredTime = subject.preferredTime ?? 'any'
        const normalisedName = name.trim().toLowerCase()
        const hasConflict = get().subjects.some(
          (existing) =>
            existing.levelId === levelId && existing.name.trim().toLowerCase() === normalisedName
        )
        if (hasConflict || !name.trim()) {
          return false
        }
        try {
          const created = await apiCreateSubject({
            name,
            levelId,
            weeklyBlocks,
            maxDailyBlocks,
            type: subject.type,
            color: subject.color,
            preferredTime
          })
          const mapped = mapSubjectResponse(created)
          set((state) => ({ subjects: [mapped, ...state.subjects] }))
          await get().loadFromServer({ force: true, resources: ['subjects'] })
          return true
        } catch (error) {
          console.error('No fue posible crear la asignatura', error)
          return false
        }
      },
      // Método que edita una asignatura y sincroniza las referencias de los profesores.
      updateSubject: async (id, subject) => {
        const levelId = normaliseLevelId(subject.levelId)
        const name = subject.name.slice(0, 50)
        const weeklyBlocks = Math.max(1, Number(subject.weeklyBlocks) || 1)
        const maxDailyBlocks = Math.max(1, Number(subject.maxDailyBlocks) || 1)
        const preferredTime: SubjectPreferredTime = subject.preferredTime ?? 'any'
        const normalisedName = name.trim().toLowerCase()
        const hasConflict = get().subjects.some(
          (existing) =>
            existing.id !== id &&
            existing.levelId === levelId &&
            existing.name.trim().toLowerCase() === normalisedName
        )
        if (hasConflict || !name.trim()) {
          return false
        }
        const current = get().subjects.find((item) => item.id === id)
        if (!current) {
          return false
        }
        try {
          const updated = await apiUpdateSubject(current.name, {
            name,
            levelId,
            weeklyBlocks,
            maxDailyBlocks,
            type: subject.type,
            color: subject.color,
            preferredTime
          })
          const mapped = mapSubjectResponse(updated)
          set((state) => {
            const updatedSubjects = state.subjects.map((item) => (item.id === id ? mapped : item))
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
          return true
        } catch (error) {
          console.error('No fue posible actualizar la asignatura', error)
          return false
        }
      },
      // Método que elimina una asignatura y limpia a los docentes que se quedan sin materias.
      removeSubject: async (id) => {
        const subject = get().subjects.find((item) => item.id === id)
        if (!subject) {
          return
        }
        try {
          await apiDeleteSubject(subject.name)
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
        } catch (error) {
          console.error('No fue posible eliminar la asignatura', error)
        }
      },
      // Método que crea un curso nuevo controlando el uso exclusivo del aula.
      addCourse: async (course) => {
        const levelId = normaliseLevelId(course.levelId)
        const name = course.name.slice(0, 50)
        const headTeacherId = typeof course.headTeacherId === 'number' ? course.headTeacherId : null
        const classroomId = typeof course.classroomId === 'number' ? course.classroomId : null
        if (
          !name.trim() ||
          (classroomId !== null &&
            get().courses.some((existing) => existing.classroomId === classroomId))
        ) {
          return false
        }
        try {
          const created = await apiCreateCourse({
            name,
            levelId,
            headTeacherId,
            classroomId
          })
          const mapped = mapCourseResponse(created)
          set((state) => ({ courses: [mapped, ...state.courses] }))
          await get().loadFromServer({ force: true, resources: ['courses'] })
          return true
        } catch (error) {
          console.error('No fue posible crear el curso', error)
          return false
        }
      },
      // Método que actualiza un curso y ajusta a los profesores vinculados.
      updateCourse: async (id, course) => {
        const levelId = normaliseLevelId(course.levelId)
        const name = course.name.slice(0, 50)
        const headTeacherId = typeof course.headTeacherId === 'number' ? course.headTeacherId : null
        const classroomId = typeof course.classroomId === 'number' ? course.classroomId : null
        if (
          !name.trim() ||
          (classroomId !== null &&
            get().courses.some(
              (existing) => existing.id !== id && existing.classroomId === classroomId
            ))
        ) {
          return false
        }
        try {
          const updated = await apiUpdateCourse(id, {
            name,
            levelId,
            headTeacherId,
            classroomId
          })
          const mapped = mapCourseResponse(updated)
          set((state) => {
            const updatedCourses = state.courses.map((item) => (item.id === id ? mapped : item))
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
          return true
        } catch (error) {
          console.error('No fue posible actualizar el curso', error)
          return false
        }
      },
      // Método que elimina un curso y reacomoda los docentes restantes.
      removeCourse: async (id) => {
        try {
          await apiDeleteCourse(id)
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
        } catch (error) {
          console.error('No fue posible eliminar el curso', error)
        }
      },
      // Método que incorpora un profesor respetando nivel, cursos asignables y tipo de asignatura.
      addTeacher: async (teacher) => {
        const levelId = normaliseLevelId(teacher.levelId)
        const name = teacher.name.slice(0, 50)
        const state = get()
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
        const weeklyHours = Math.max(1, Number(teacher.weeklyHours) || 1)
        if (!name.trim() || subjectIds.length === 0 || resolvedCourseIds.length === 0) {
          return false
        }
        try {
          const created = await apiCreateTeacher({
            name,
            levelId,
            subjectIds,
            courseIds: resolvedCourseIds,
            weeklyHours,
            contractType: teacher.contractType
          })
          const mapped = mapTeacherResponse(created)
          set((current) => ({ teachers: [mapped, ...current.teachers] }))
          await get().loadFromServer({ force: true, resources: ['teachers'] })
          return true
        } catch (error) {
          console.error('No fue posible crear el profesor', error)
          return false
        }
      },
      // Método que actualiza un profesor conservando las reglas de asignación especial.
      updateTeacher: async (id, teacher) => {
        const levelId = normaliseLevelId(teacher.levelId)
        const name = teacher.name.slice(0, 50)
        const state = get()
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
        const weeklyHours = Math.max(1, Number(teacher.weeklyHours) || 1)
        if (!name.trim() || subjectIds.length === 0 || resolvedCourseIds.length === 0) {
          return false
        }
        try {
          const updated = await apiUpdateTeacher(id, {
            name,
            levelId,
            subjectIds,
            courseIds: resolvedCourseIds,
            weeklyHours,
            contractType: teacher.contractType
          })
          const mapped = mapTeacherResponse(updated)
          set((current) => ({
            teachers: current.teachers.map((item) => (item.id === id ? mapped : item))
          }))
          return true
        } catch (error) {
          console.error('No fue posible actualizar el profesor', error)
          return false
        }
      },
      // Método que elimina a un profesor del catálogo.
      removeTeacher: async (id) => {
        try {
          await apiDeleteTeacher(id)
          set((state) => ({
            teachers: state.teachers.filter((teacher) => teacher.id !== id)
          }))
        } catch (error) {
          console.error('No fue posible eliminar el profesor', error)
        }
      }
    }),
    {
      name: 'scheduler-data-store',
      version: 10,
      // Función que migra datos antiguos del almacenamiento local a la forma actual del store.
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
                color,
                preferredTime: 'any'
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
            teachers: teachers.length > 0 ? teachers : defaultState.teachers,
            hasLoadedFromServer: false,
            loadedResources: createDefaultLoadedResources(),
            resourceStatus: createDefaultResourceStatus()
          } as SchedulerState
        } catch (error) {
          console.warn('No fue posible migrar el estado anterior, se usarán valores por defecto.', error)
          return {
            levels: FIXED_LEVELS,
            classrooms: defaultState.classrooms,
            subjects: defaultState.subjects,
            courses: defaultState.courses,
            teachers: defaultState.teachers,
            hasLoadedFromServer: false,
            loadedResources: createDefaultLoadedResources(),
            resourceStatus: createDefaultResourceStatus()
          }
        }
      }
    }
  )
)
