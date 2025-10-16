import type { ConfigResponse } from '../services/configService'
import type { CourseData, SubjectData, TeacherData } from '../store/useSchedulerData'

const WORKING_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const

export interface PreviewCell {
  subject: string
  teacher?: string
  course?: string
  color: string
}

export interface PreviewRow {
  time: string
  cells: (PreviewCell | null)[]
}

export interface PreviewTable {
  id: number | string
  name: string
  rows: PreviewRow[]
}

export interface SchedulePreview {
  days: readonly string[]
  courses: PreviewTable[]
  teachers: PreviewTable[]
  summary: {
    totalCourses: number
    totalTeachers: number
    totalSessions: number
  }
  config: {
    blockDuration: number
    dayStart: string
  }
}

interface BuildPreviewInput {
  courses: CourseData[]
  subjects: SubjectData[]
  teachers: TeacherData[]
  mode: 'full' | 'course'
  courseId?: number
  config: ConfigResponse
}

interface SlotCell {
  subject: string
  teacher: string
  color: string
}

interface CourseGrid {
  course: CourseData
  grid: (SlotCell | null)[][]
}

function getTimeLabel(start: string, minutesToAdd: number) {
  const [hour, minute] = start.split(':').map(Number)
  const base = hour * 60 + minute + minutesToAdd
  const nextHour = Math.floor(base / 60)
  const nextMinute = base % 60
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')} - ${`${nextHour}`.padStart(2, '0')}:${`${nextMinute}`.padStart(2, '0')}`
}

function normaliseName(value: string) {
  return value.trim().toLowerCase()
}

function resolveTeacher(subject: SubjectData, teachers: TeacherData[]) {
  const subjectName = normaliseName(subject.name)
  const match = teachers.find((teacher) => teacher.subjects.map(normaliseName).includes(subjectName))
  return match?.name ?? 'Sin profesor asignado'
}

function distributeSessions(
  course: CourseData,
  subjects: SubjectData[],
  teachers: TeacherData[],
  days: readonly string[]
): CourseGrid | { error: string } {
  const applicableSubjects = subjects.filter(
    (subject) => subject.level === course.level || subject.level.toLowerCase() === 'general'
  )

  if (applicableSubjects.length === 0) {
    return { error: `El curso ${course.name} no tiene asignaturas asociadas a su nivel.` }
  }

  const daySessions: SlotCell[][] = days.map(() => [])
  const normalSubjects = applicableSubjects.filter((subject) => subject.type === 'Normal')
  const specialSubjects = applicableSubjects.filter((subject) => subject.type === 'Especial')

  let dayPointer = 0

  for (const subject of normalSubjects) {
    const teacherName = resolveTeacher(subject, teachers)
    let allocated = 0
    let guard = 0

    while (allocated < subject.weeklyBlocks && guard < 500) {
      const dayIndex = dayPointer % days.length
      const day = daySessions[dayIndex]
      const lastTwo = day.slice(-2)

      if (lastTwo.length === 2 && lastTwo.every((cell) => cell.subject === subject.name)) {
        dayPointer++
        guard++
        continue
      }

      day.push({ subject: subject.name, teacher: teacherName, color: subject.color })
      allocated++
      dayPointer++
    }

    if (allocated < subject.weeklyBlocks) {
      for (const day of daySessions) {
        while (allocated < subject.weeklyBlocks) {
          day.push({ subject: subject.name, teacher: teacherName, color: subject.color })
          allocated++
        }
      }
    }
  }

  dayPointer = 0
  for (const subject of specialSubjects) {
    const teacherName = resolveTeacher(subject, teachers)
    let allocated = 0
    let guard = 0

    while (allocated < subject.weeklyBlocks && guard < 500) {
      const dayIndex = dayPointer % days.length
      const day = daySessions[dayIndex]
      const lastEntry = day.at(-1)

      if (lastEntry?.subject === subject.name) {
        dayPointer++
        guard++
        continue
      }

      day.push({ subject: subject.name, teacher: teacherName, color: subject.color })
      allocated++
      dayPointer++
    }

    if (allocated < subject.weeklyBlocks) {
      for (const day of daySessions) {
        while (allocated < subject.weeklyBlocks) {
          day.push({ subject: subject.name, teacher: teacherName, color: subject.color })
          allocated++
        }
      }
    }
  }

  const maxBlocks = Math.max(...daySessions.map((sessions) => sessions.length), 0)

  if (maxBlocks === 0) {
    return { error: `El curso ${course.name} no tiene bloques planificados.` }
  }

  const grid: (SlotCell | null)[][] = Array.from({ length: maxBlocks }, (_, rowIndex) =>
    days.map((_, dayIndex) => daySessions[dayIndex][rowIndex] ?? null)
  )

  return { course, grid }
}

export function buildSchedulePreview(input: BuildPreviewInput): { preview?: SchedulePreview; error?: string } {
  const { courses, subjects, teachers, mode, courseId, config } = input

  if (courses.length === 0) {
    return { error: 'No hay cursos disponibles para generar una previsualización.' }
  }

  if (subjects.length === 0) {
    return { error: 'No existen asignaturas registradas. Agrega al menos una para continuar.' }
  }

  if (teachers.length === 0) {
    return { error: 'No hay profesores registrados para asignar a las clases.' }
  }

  const workingCourses =
    mode === 'course'
      ? (() => {
          const match = courses.find((course) => course.id === courseId)
          return match ? [match] : []
        })()
      : courses

  if (workingCourses.length === 0) {
    return { error: 'No se encontró el curso solicitado para la previsualización.' }
  }

  const blockDuration = config.blockDuration ?? 45
  const dayStart = config.dayStart ?? '08:00'

  const courseGrids: CourseGrid[] = []
  for (const course of workingCourses) {
    const grid = distributeSessions(course, subjects, teachers, WORKING_DAYS)
    if ('error' in grid) {
      return { error: grid.error }
    }
    courseGrids.push(grid)
  }

  const globalRowCount = Math.max(...courseGrids.map((grid) => grid.grid.length))
  const timeLabels = Array.from({ length: globalRowCount }, (_, index) =>
    getTimeLabel(dayStart, blockDuration * index)
  )

  const courseTables: PreviewTable[] = courseGrids.map(({ course, grid }) => ({
    id: course.id,
    name: course.name,
    rows: timeLabels.map((time, rowIndex) => ({
      time,
      cells: WORKING_DAYS.map((_, dayIndex) => grid[rowIndex]?.[dayIndex] ?? null)
    }))
  }))

  const teacherMap = new Map<string, (PreviewCell | null)[][]>()
  for (const { course, grid } of courseGrids) {
    for (let rowIndex = 0; rowIndex < globalRowCount; rowIndex++) {
      for (let dayIndex = 0; dayIndex < WORKING_DAYS.length; dayIndex++) {
        const cell = grid[rowIndex]?.[dayIndex]
        if (!cell || cell.teacher === 'Sin profesor asignado') {
          continue
        }

        if (!teacherMap.has(cell.teacher)) {
          teacherMap.set(
            cell.teacher,
            Array.from({ length: globalRowCount }, () => Array.from({ length: WORKING_DAYS.length }, () => null))
          )
        }

        const teacherGrid = teacherMap.get(cell.teacher)!
        teacherGrid[rowIndex][dayIndex] = {
          subject: cell.subject,
          course: course.name,
          color: cell.color
        }
      }
    }
  }

  const teacherTables: PreviewTable[] = Array.from(teacherMap.entries()).map(([teacher, grid]) => ({
    id: teacher,
    name: teacher,
    rows: timeLabels.map((time, rowIndex) => ({
      time,
      cells: WORKING_DAYS.map((_, dayIndex) => grid[rowIndex]?.[dayIndex] ?? null)
    }))
  }))

  const totalSessions = courseGrids.reduce((acc, { grid }) => {
    return (
      acc +
      grid.reduce((sum, row) => {
        return sum + row.filter(Boolean).length
      }, 0)
    )
  }, 0)

  return {
    preview: {
      days: WORKING_DAYS,
      courses: courseTables,
      teachers: teacherTables,
      summary: {
        totalCourses: courseTables.length,
        totalTeachers: teacherTables.length,
        totalSessions
      },
      config: {
        blockDuration,
        dayStart
      }
    }
  }
}
