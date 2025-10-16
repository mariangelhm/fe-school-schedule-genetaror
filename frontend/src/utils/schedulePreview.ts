import type { ConfigResponse, CycleConfig } from '../services/configService'
import type { CourseData, SubjectData, TeacherData } from '../store/useSchedulerData'

export const WORKING_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const
export const LUNCH_LABEL = 'Hora de almuerzo'

export interface PreviewCell {
  subject: string
  teacher?: string
  course?: string
  color: string
}

export interface PreviewRow {
  time: string
  kind: 'class' | 'lunch'
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
    lunchStart: string
    lunchDuration: number
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

interface ScheduleStructureRow {
  kind: 'class' | 'lunch'
  time: string
  classRowIndex?: number
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function minutesToTime(minutes: number): string {
  const normalised = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hour = Math.floor(normalised / 60)
  const minute = normalised % 60
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`
}

function minutesToRange(start: number, duration: number): string {
  const end = start + duration
  return `${minutesToTime(start)} - ${minutesToTime(end)}`
}

function normaliseName(value: string) {
  return value.trim().toLowerCase()
}

function resolveTeacher(subject: SubjectData, teachers: TeacherData[]) {
  const subjectName = normaliseName(subject.name)
  const match = teachers.find((teacher) => teacher.subjects.map(normaliseName).includes(subjectName))
  return match?.name ?? 'Sin profesor asignado'
}

function findCycleForLevel(level: string, cycles: CycleConfig[] = []) {
  const target = normaliseName(level)
  return cycles.find((cycle) => cycle.levels.map(normaliseName).includes(target))
}

function calculateDailyCapacity(
  course: CourseData,
  config: ConfigResponse,
  cycles: CycleConfig[]
): { maxDailyBlocks: number; totalCapacity: number } {
  const blockDuration = config.blockDuration ?? 45
  const dayStart = config.dayStart ?? '08:00'
  const lunchStart = config.lunchStart
  const lunchDuration = Math.max(0, config.lunchDuration ?? 0)

  const cycle = findCycleForLevel(course.level, cycles)
  const dayStartMinutes = timeToMinutes(dayStart)
  const fallbackEnd = dayStartMinutes + blockDuration * 8 + lunchDuration
  const dayEndMinutes = Math.max(dayStartMinutes + blockDuration, cycle ? timeToMinutes(cycle.endTime) : fallbackEnd)

  let effectiveLunch = 0
  if (lunchStart) {
    const lunchStartMinutes = timeToMinutes(lunchStart)
    if (lunchStartMinutes > dayStartMinutes && lunchStartMinutes < dayEndMinutes) {
      effectiveLunch = lunchDuration
    }
  }

  const availableMinutes = Math.max(0, dayEndMinutes - dayStartMinutes - effectiveLunch)
  const maxDailyBlocks = Math.max(1, Math.floor(availableMinutes / blockDuration))
  const totalCapacity = maxDailyBlocks * WORKING_DAYS.length

  return { maxDailyBlocks, totalCapacity }
}

function distributeSessions(
  course: CourseData,
  subjects: SubjectData[],
  teachers: TeacherData[],
  days: readonly string[],
  maxDailyBlocks: number
): CourseGrid | { error: string } {
  const applicableSubjects = subjects.filter(
    (subject) => subject.level === course.level || subject.level.toLowerCase() === 'general'
  )

  if (applicableSubjects.length === 0) {
    return { error: `El curso ${course.name} no tiene asignaturas asociadas a su nivel.` }
  }

  const totalRequiredBlocks = applicableSubjects.reduce((acc, subject) => acc + subject.weeklyBlocks, 0)
  if (totalRequiredBlocks === 0) {
    return { error: `El curso ${course.name} no tiene carga horaria configurada.` }
  }

  const daySessions: SlotCell[][] = days.map(() => [])
  const normalSubjects = applicableSubjects.filter((subject) => subject.type === 'Normal')
  const specialSubjects = applicableSubjects.filter((subject) => subject.type === 'Especial')

  let dayPointer = 0

  const assignSubject = (subject: SubjectData, ensureTailPlacement: boolean) => {
    const teacherName = resolveTeacher(subject, teachers)
    let allocated = 0
    let guard = 0

    while (allocated < subject.weeklyBlocks && guard < 1000) {
      const dayIndex = dayPointer % days.length
      const day = daySessions[dayIndex]

      if (day.length >= maxDailyBlocks) {
        dayPointer++
        guard++
        continue
      }

      if (!ensureTailPlacement) {
        const lastTwo = day.slice(-2)
        if (lastTwo.length === 2 && lastTwo.every((cell) => cell.subject === subject.name)) {
          dayPointer++
          guard++
          continue
        }
      } else {
        const lastEntry = day.length > 0 ? day[day.length - 1] : undefined
        if (lastEntry?.subject === subject.name) {
          dayPointer++
          guard++
          continue
        }
      }

      day.push({ subject: subject.name, teacher: teacherName, color: subject.color })
      allocated++
      dayPointer++
      guard++
    }

    if (allocated < subject.weeklyBlocks) {
      for (const day of daySessions) {
        if (day.length >= maxDailyBlocks) {
          continue
        }

        while (day.length < maxDailyBlocks && allocated < subject.weeklyBlocks) {
          day.push({ subject: subject.name, teacher: teacherName, color: subject.color })
          allocated++
        }

        if (allocated >= subject.weeklyBlocks) {
          break
        }
      }
    }

    if (allocated < subject.weeklyBlocks) {
      throw new Error(`No hay bloques suficientes para asignar ${subject.name} en ${course.name}.`)
    }
  }

  try {
    for (const subject of normalSubjects) {
      assignSubject(subject, false)
    }

    dayPointer = 0
    for (const subject of specialSubjects) {
      assignSubject(subject, true)
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : `No fue posible distribuir todos los bloques para ${course.name}. Ajusta los ciclos o la carga horaria.`
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

function buildScheduleStructure(classRowCount: number, config: ConfigResponse): ScheduleStructureRow[] {
  const blockDuration = config.blockDuration ?? 45
  const dayStart = config.dayStart ?? '08:00'
  const lunchStart = config.lunchStart
  const lunchDuration = Math.max(0, config.lunchDuration ?? 0)

  if (classRowCount === 0) {
    if (lunchStart && lunchDuration > 0) {
      const startMinutes = timeToMinutes(lunchStart)
      return [
        {
          kind: 'lunch',
          time: minutesToRange(startMinutes, lunchDuration)
        }
      ]
    }
    return []
  }

  const dayStartMinutes = timeToMinutes(dayStart)
  const lunchStartMinutes = lunchStart ? timeToMinutes(lunchStart) : null
  const lunchIndex =
    lunchStartMinutes !== null && lunchDuration > 0
      ? Math.max(0, Math.floor((lunchStartMinutes - dayStartMinutes) / blockDuration))
      : null

  const rows: ScheduleStructureRow[] = []
  let currentMinutes = dayStartMinutes
  let lunchInserted = false

  for (let classIndex = 0; classIndex < classRowCount; classIndex++) {
    if (!lunchInserted && lunchIndex !== null && classIndex === lunchIndex) {
      const lunchStartTime = lunchStartMinutes !== null ? Math.max(currentMinutes, lunchStartMinutes) : currentMinutes
      rows.push({ kind: 'lunch', time: minutesToRange(lunchStartTime, lunchDuration) })
      currentMinutes = lunchStartTime + lunchDuration
      lunchInserted = true
    }

    const start = currentMinutes
    const end = start + blockDuration
    rows.push({ kind: 'class', time: minutesToRange(start, blockDuration), classRowIndex: classIndex })
    currentMinutes = end
  }

  if (!lunchInserted && lunchIndex !== null) {
    const lunchStartTime = lunchStartMinutes !== null ? lunchStartMinutes : currentMinutes
    rows.push({ kind: 'lunch', time: minutesToRange(lunchStartTime, lunchDuration) })
  }

  return rows
}

export function syncPreview(preview: SchedulePreview): SchedulePreview {
  const { courses, days } = preview

  if (courses.length === 0) {
    return {
      ...preview,
      teachers: [],
      summary: { totalCourses: 0, totalTeachers: 0, totalSessions: 0 }
    }
  }

  const referenceRows = courses[0].rows
  const rowCount = referenceRows.length
  const lunchRowIndexes = new Set<number>()
  referenceRows.forEach((row, index) => {
    if (row.kind === 'lunch') {
      lunchRowIndexes.add(index)
    }
  })

  const lunchCell: PreviewCell = { subject: LUNCH_LABEL, color: '#f97316' }
  const teacherMap = new Map<string, (PreviewCell | null)[][]>()

  for (const table of courses) {
    table.rows.forEach((row, rowIndex) => {
      if (row.kind !== 'class') {
        return
      }

      row.cells.forEach((cell, dayIndex) => {
        if (!cell || !cell.teacher || cell.teacher === 'Sin profesor asignado') {
          return
        }

        if (!teacherMap.has(cell.teacher)) {
          teacherMap.set(
            cell.teacher,
            Array.from({ length: rowCount }, () => Array.from({ length: days.length }, () => null))
          )
        }

        const teacherGrid = teacherMap.get(cell.teacher)!
        teacherGrid[rowIndex][dayIndex] = {
          subject: cell.subject,
          course: table.name,
          color: cell.color
        }
      })
    })
  }

  teacherMap.forEach((grid) => {
    lunchRowIndexes.forEach((rowIndex) => {
      grid[rowIndex] = Array.from({ length: days.length }, () => lunchCell)
    })
  })

  const teacherTables: PreviewTable[] = Array.from(teacherMap.entries()).map(([teacher, grid]) => ({
    id: teacher,
    name: teacher,
    rows: referenceRows.map((row, rowIndex) => ({
      time: row.time,
      kind: row.kind,
      cells:
        row.kind === 'lunch'
          ? Array.from({ length: days.length }, () => lunchCell)
          : grid[rowIndex]
    }))
  }))

  const totalSessions = courses.reduce((acc, table) => {
    return (
      acc +
      table.rows.reduce((sum, row) => {
        if (row.kind !== 'class') {
          return sum
        }
        return sum + row.cells.filter(Boolean).length
      }, 0)
    )
  }, 0)

  return {
    ...preview,
    teachers: teacherTables,
    summary: {
      totalCourses: courses.length,
      totalTeachers: teacherTables.length,
      totalSessions
    }
  }
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
  const lunchStart = config.lunchStart ?? '13:00'
  const lunchDuration = Math.max(0, config.lunchDuration ?? 60)
  const cycles = config.cycles ?? []

  const courseGrids: CourseGrid[] = []

  for (const course of workingCourses) {
    const { maxDailyBlocks, totalCapacity } = calculateDailyCapacity(course, config, cycles)
    const applicableSubjects = subjects.filter(
      (subject) => subject.level === course.level || subject.level.toLowerCase() === 'general'
    )
    const totalRequiredBlocks = applicableSubjects.reduce((acc, subject) => acc + subject.weeklyBlocks, 0)

    if (totalRequiredBlocks > totalCapacity) {
      return {
        error: `El ciclo asignado a ${course.name} solo permite ${totalCapacity} bloques a la semana, pero se requieren ${totalRequiredBlocks}. Ajusta los horarios del ciclo o la carga de asignaturas.`
      }
    }

    const grid = distributeSessions(course, subjects, teachers, WORKING_DAYS, maxDailyBlocks)
    if ('error' in grid) {
      return { error: grid.error }
    }
    courseGrids.push(grid)
  }

  const globalRowCount = Math.max(...courseGrids.map((grid) => grid.grid.length), 0)
  const structure = buildScheduleStructure(globalRowCount, config)
  const lunchCell: PreviewCell = { subject: LUNCH_LABEL, color: '#f97316' }

  const courseTables: PreviewTable[] = courseGrids.map(({ course, grid }) => ({
    id: course.id,
    name: course.name,
    rows: structure.map((row) => {
      if (row.kind === 'lunch') {
        return {
          time: row.time,
          kind: 'lunch',
          cells: Array.from({ length: WORKING_DAYS.length }, () => lunchCell)
        }
      }

      const rowIndex = row.classRowIndex ?? 0
      return {
        time: row.time,
        kind: 'class',
        cells: WORKING_DAYS.map((_, dayIndex) => {
          const cell = grid[rowIndex]?.[dayIndex]
          return cell
            ? { subject: cell.subject, teacher: cell.teacher, color: cell.color }
            : null
        })
      }
    })
  }))

  const basePreview: SchedulePreview = {
    days: WORKING_DAYS,
    courses: courseTables,
    teachers: [],
    summary: {
      totalCourses: courseTables.length,
      totalTeachers: 0,
      totalSessions: 0
    },
    config: {
      blockDuration,
      dayStart,
      lunchStart,
      lunchDuration
    }
  }

  return { preview: syncPreview(basePreview) }
}

