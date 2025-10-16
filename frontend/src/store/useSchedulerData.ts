import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubjectType = 'Normal' | 'Especial'
type ContractType = 'Completo' | 'Parcial'
export interface SubjectData {
  id: number
  name: string
  level: string
  weeklyBlocks: number
  type: SubjectType
  color: string
}

export interface CourseData {
  id: number
  name: string
  level: string
  headTeacher: string
  students: number
}

export interface TeacherData {
  id: number
  name: string
  contractType: ContractType
  subjects: string[]
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
  addCourse: (course: Omit<CourseData, 'id'>) => void
  removeCourse: (id: number) => void
  addTeacher: (teacher: Omit<TeacherData, 'id'>) => void
  removeTeacher: (id: number) => void
  addHoliday: (holiday: Omit<HolidayData, 'id'>) => void
  removeHoliday: (id: number) => void
  addEvent: (event: Omit<EventData, 'id'>) => void
  removeEvent: (id: number) => void
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
    { id: 1, name: 'Lenguaje', level: '1° Básico', weeklyBlocks: 6, type: 'Normal', color: '#2563eb' },
    { id: 2, name: 'Matemática', level: '1° Básico', weeklyBlocks: 5, type: 'Normal', color: '#9333ea' },
    { id: 3, name: 'Música', level: 'General', weeklyBlocks: 2, type: 'Especial', color: '#eab308' }
  ],
  courses: [
    { id: 1, name: '1° Básico A', level: '1° Básico', headTeacher: 'María López', students: 32 },
    { id: 2, name: '2° Básico B', level: '2° Básico', headTeacher: 'Carlos Rivas', students: 29 }
  ],
  teachers: [
    {
      id: 1,
      name: 'Ana Torres',
      contractType: 'Completo',
      subjects: ['Lenguaje', 'Historia'],
      weeklyHours: 38,
      availableBlocks: 'Lun-Vie 08:00-16:00'
    },
    {
      id: 2,
      name: 'Luis Gómez',
      contractType: 'Parcial',
      subjects: ['Música'],
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
    (set) => ({
      ...defaultState,
      addSubject: (subject) =>
        set((state) => ({
          subjects: [{ id: Date.now(), ...subject }, ...state.subjects]
        })),
      removeSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id)
        })),
      addCourse: (course) =>
        set((state) => ({
          courses: [{ id: Date.now(), ...course }, ...state.courses]
        })),
      removeCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== id)
        })),
      addTeacher: (teacher) =>
        set((state) => ({
          teachers: [{ id: Date.now(), ...teacher }, ...state.teachers]
        })),
      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((teacher) => teacher.id !== id)
        })),
      addHoliday: (holiday) =>
        set((state) => ({
          holidays: [{ id: Date.now(), ...holiday }, ...state.holidays].sort((a, b) => a.date.localeCompare(b.date))
        })),
      removeHoliday: (id) =>
        set((state) => ({
          holidays: state.holidays.filter((holiday) => holiday.id !== id)
        })),
      addEvent: (event) =>
        set((state) => ({
          events: [{ id: Date.now(), ...event }, ...state.events].sort((a, b) => a.date.localeCompare(b.date))
        })),
      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id)
        }))
    }),
    {
      name: 'scheduler-data-store'
    }
  )
)

export type { SubjectType, ContractType }
