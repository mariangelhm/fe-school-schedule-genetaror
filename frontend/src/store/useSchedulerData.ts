import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubjectType = 'Normal' | 'Especial'
type ContractType = 'Completo' | 'Parcial'

export interface SubjectCycleLoad {
  cycleId: string
  weeklyBlocks: number
}

export interface SubjectData {
  id: number
  name: string
  level: string
  cycleLoads: SubjectCycleLoad[]
  maxDailyBlocks: number
  type: SubjectType
  color: string
}

export interface CourseData {
  id: number
  name: string
  level: string
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

export interface HolidayData {
  id: number
  date: string
  description: string
}

export interface EventData {
  id: number
  date: string
  description: string
  noClasses: boolean
}

interface SchedulerState {
  subjects: SubjectData[]
  courses: CourseData[]
  teachers: TeacherData[]
  holidays: HolidayData[]
  events: EventData[]
  addSubject: (subject: Omit<SubjectData, 'id'>) => void
  removeSubject: (id: number) => void
  updateSubject: (id: number, subject: Omit<SubjectData, 'id'>) => void
  addCourse: (course: Omit<CourseData, 'id'>) => void
  removeCourse: (id: number) => void
  updateCourse: (id: number, course: Omit<CourseData, 'id'>) => void
  addTeacher: (teacher: Omit<TeacherData, 'id'>) => void
  removeTeacher: (id: number) => void
  updateTeacher: (id: number, teacher: Omit<TeacherData, 'id'>) => void
  addHoliday: (holiday: Omit<HolidayData, 'id'>) => void
  removeHoliday: (id: number) => void
  updateHoliday: (id: number, holiday: Omit<HolidayData, 'id'>) => void
  addEvent: (event: Omit<EventData, 'id'>) => void
  removeEvent: (id: number) => void
  updateEvent: (id: number, event: Omit<EventData, 'id'>) => void
}

const today = new Date()

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]
}

const defaultState: Pick<
  SchedulerState,
  'subjects' | 'courses' | 'teachers' | 'holidays' | 'events'
> = {
  subjects: [
    {
      id: 1,
      name: 'Lenguaje',
      level: '1° Básico',
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
      level: '1° Básico',
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
      level: 'General',
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
      level: '1° Básico',
      cycleId: 'ciclo-basico-i',
      headTeacher: 'María López',
      students: 32
    },
    {
      id: 2,
      name: '2° Básico B',
      level: '2° Básico',
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
  ],
  holidays: [
    { id: 1, date: formatDate(new Date(today.getFullYear(), 4, 1)), description: 'Día del trabajador' },
    { id: 2, date: formatDate(new Date(today.getFullYear(), 8, 18)), description: 'Fiestas Patrias' }
  ],
  events: [
    { id: 1, date: formatDate(new Date(today.getFullYear(), 2, 15)), description: 'Jornada docente', noClasses: true },
    { id: 2, date: formatDate(new Date(today.getFullYear(), 9, 5)), description: 'Simulacro de emergencia', noClasses: false }
  ]
}

export const useSchedulerDataStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      addSubject: (subject) =>
        set((state) => ({
          subjects: [{ id: Date.now(), ...subject }, ...state.subjects]
        })),
      updateSubject: (id, subject) =>
        set((state) => ({
          subjects: state.subjects.map((item) => (item.id === id ? { id, ...subject } : item))
        })),
      removeSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id)
        })),
      addCourse: (course) =>
        set((state) => ({
          courses: [{ id: Date.now(), ...course }, ...state.courses]
        })),
      updateCourse: (id, course) =>
        set((state) => ({
          courses: state.courses.map((item) => (item.id === id ? { id, ...course } : item))
        })),
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
        })),
      addHoliday: (holiday) =>
        set((state) => ({
          holidays: [{ id: Date.now(), ...holiday }, ...state.holidays].sort((a, b) => a.date.localeCompare(b.date))
        })),
      updateHoliday: (id, holiday) =>
        set((state) => ({
          holidays: state.holidays
            .map((item) => (item.id === id ? { id, ...holiday } : item))
            .sort((a, b) => a.date.localeCompare(b.date))
        })),
      removeHoliday: (id) =>
        set((state) => ({
          holidays: state.holidays.filter((holiday) => holiday.id !== id)
        })),
      addEvent: (event) =>
        set((state) => ({
          events: [{ id: Date.now(), ...event }, ...state.events].sort((a, b) => a.date.localeCompare(b.date))
        })),
      updateEvent: (id, event) =>
        set((state) => ({
          events: state.events
            .map((item) => (item.id === id ? { id, ...event } : item))
            .sort((a, b) => a.date.localeCompare(b.date))
        })),
      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id)
        }))
    }),
    {
      name: 'scheduler-data-store',
      version: 2,
      migrate: (persistedState: any, version) => {
        if (!persistedState || version >= 2) {
          return persistedState as SchedulerState
        }

        const ensureCycleLoads = (subject: any): SubjectData => {
          const weekly = typeof subject.weeklyBlocks === 'number' ? subject.weeklyBlocks : 0
          const cycleLoads: SubjectCycleLoad[] = [
            { cycleId: 'ciclo-basico-i', weeklyBlocks: weekly },
            { cycleId: 'ciclo-basico-ii', weeklyBlocks: weekly }
          ]
          return {
            id: subject.id,
            name: subject.name,
            level: subject.level,
            cycleLoads,
            maxDailyBlocks: Math.max(1, Math.min(3, weekly || 1)),
            type: subject.type ?? 'Normal',
            color: subject.color ?? '#2563eb'
          }
        }

        return {
          ...persistedState,
          subjects: Array.isArray(persistedState.subjects)
            ? persistedState.subjects.map(ensureCycleLoads)
            : defaultState.subjects,
          courses: Array.isArray(persistedState.courses)
            ? persistedState.courses.map((course: any) => ({
                id: course.id,
                name: course.name,
                level: course.level,
                cycleId: course.cycleId ?? 'ciclo-basico-i',
                headTeacher: course.headTeacher,
                students: course.students
              }))
            : defaultState.courses,
          teachers: Array.isArray(persistedState.teachers)
            ? persistedState.teachers.map((teacher: any) => ({
                id: teacher.id,
                name: teacher.name,
                contractType: teacher.contractType ?? 'Completo',
                subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
                cycles: Array.isArray(teacher.cycles)
                  ? teacher.cycles
                  : ['ciclo-basico-i', 'ciclo-basico-ii'],
                weeklyHours: teacher.weeklyHours,
                availableBlocks: teacher.availableBlocks ?? ''
              }))
            : defaultState.teachers,
          holidays: Array.isArray(persistedState.holidays) ? persistedState.holidays : defaultState.holidays,
          events: Array.isArray(persistedState.events) ? persistedState.events : defaultState.events
        }
      }
    }
  )
)

export type { SubjectType, ContractType }
