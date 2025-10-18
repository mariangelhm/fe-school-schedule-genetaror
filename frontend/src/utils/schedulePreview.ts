import type { ConfigResponse, CycleConfig } from '../services/configService'
import type { CourseData, LevelData, SubjectData, TeacherData } from '../store/useSchedulerData'

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
  levels: LevelData[]
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

function getLevelName(levelId: string, levels: LevelData[]): string {
  return levels.find((level) => level.id === levelId)?.name ?? levelId
}

function resolveCourseCycle(course: CourseData, levels: LevelData[], cycles: CycleConfig[] = []) {
  if (course.cycleId) {
    const byId = cycles.find((cycle) => cycle.id === course.cycleId)
    if (byId) {
      return byId
    }
  }

  const levelName = getLevelName(course.levelId, levels)
  const target = normaliseName(levelName)
  return cycles.find((cycle) => cycle.levels.map(normaliseName).includes(target))
}

function getWeeklyBlocksForCycle(subject: SubjectData, cycleId?: string) {
  if (!cycleId) {
    return subject.cycleLoads.reduce((acc, load) => acc + load.weeklyBlocks, 0)
  }
  const entry = subject.cycleLoads.find((load) => load.cycleId === cycleId)
  return entry?.weeklyBlocks ?? 0
}

function calculateDailyCapacity(
  course: CourseData,
  config: ConfigResponse,
  cycles: CycleConfig[],
  levels: LevelData[]
): { maxDailyBlocks: number; totalCapacity: number; cycleId?: string } {
  const blockDuration = config.blockDuration ?? 45
  const dayStart = config.dayStart ?? '08:00'
  const lunchStart = config.lunchStart
  const lunchDuration = Math.max(0, config.lunchDuration ?? 0)

  const cycle = resolveCourseCycle(course, levels, cycles)
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

  return { maxDailyBlocks, totalCapacity, cycleId: cycle?.id }
}

interface SubjectRequirement {
  subject: SubjectData
  weeklyBlocks: number
}

interface TeacherCapacity {
  teacher: TeacherData
  remainingBlocks: number
  subjects: string[]
}

function createTeacherCapacities(teachers: TeacherData[], blockDuration: number) {
  const map = new Map<number, TeacherCapacity>()
  teachers.forEach((teacher) => {
    const weeklyMinutes = Math.max(0, teacher.weeklyHours) * 60
    const capacity = Math.max(0, Math.floor(weeklyMinutes / blockDuration))
    map.set(teacher.id, {
      teacher,
      remainingBlocks: capacity,
      subjects: teacher.subjects.map(normaliseName)
    })
  })
  return map
}

function distributeSessions(
  course: CourseData,
  requirements: SubjectRequirement[],
  teacherCapacities: Map<number, TeacherCapacity>,
  days: readonly string[],
  maxDailyBlocks: number,
  courseCycleId?: string
): CourseGrid | { error: string } {
  if (requirements.length === 0) {
    return { error: `El curso ${course.name} no tiene asignaturas configuradas para su ciclo.` }
  }

  const daySessions: SlotCell[][] = days.map(() => [])
  const normalSubjects = requirements.filter((item) => item.subject.type === 'Normal')
  const specialSubjects = requirements.filter((item) => item.subject.type === 'Especial')

  const dailyCounts = new Map<number, number[]>()
  for (const requirement of requirements) {
    dailyCounts.set(requirement.subject.id, Array.from({ length: days.length }, () => 0))
  }

  let dayPointer = 0

  const assignSubject = (requirement: SubjectRequirement, ensureTailPlacement: boolean) => {
    const { subject, weeklyBlocks } = requirement
    const maxPerDay = Math.max(1, subject.maxDailyBlocks || 1)
    const counts = dailyCounts.get(subject.id) ?? Array.from({ length: days.length }, () => 0)
    dailyCounts.set(subject.id, counts)

    let allocated = 0
    let guard = 0

    const pickTeacher = (): TeacherCapacity => {
      const subjectName = normaliseName(subject.name)
      const candidates = Array.from(teacherCapacities.values()).filter((info) => {
        if (!info.subjects.includes(subjectName)) {
          return false
        }
        if (courseCycleId && info.teacher.cycles.length > 0 && !info.teacher.cycles.includes(courseCycleId)) {
          return false
        }
        return true
      })

      if (candidates.length === 0) {
        throw new Error(`No hay profesores que impartan ${subject.name} disponibles para ${course.name}.`)
      }

      candidates.sort((a, b) => b.remainingBlocks - a.remainingBlocks)
      const withCapacity = candidates.find((candidate) => candidate.remainingBlocks > 0)

      if (!withCapacity) {
        const teacherNames = candidates.map((candidate) => candidate.teacher.name).join(', ')
        throw new Error(
          `Los profesores ${teacherNames} no tienen horas disponibles para ${subject.name} en ${course.name}. Ajusta la carga semanal.`
        )
      }

      return withCapacity
    }

    while (allocated < weeklyBlocks && guard < 1000) {
      const dayIndex = dayPointer % days.length
      const day = daySessions[dayIndex]

      if (day.length >= maxDailyBlocks || counts[dayIndex] >= maxPerDay) {
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

      const teacherInfo = pickTeacher()
      day.push({ subject: subject.name, teacher: teacherInfo.teacher.name, color: subject.color })
      teacherInfo.remainingBlocks = Math.max(0, teacherInfo.remainingBlocks - 1)
      counts[dayIndex] += 1
      allocated++
      dayPointer++
      guard++
    }

    if (allocated < weeklyBlocks) {
      daySessions.forEach((day, dayIndex) => {
        if (allocated >= weeklyBlocks) {
          return
        }

        if (day.length >= maxDailyBlocks || counts[dayIndex] >= maxPerDay) {
          return
        }

        while (
          day.length < maxDailyBlocks &&
          counts[dayIndex] < maxPerDay &&
          allocated < weeklyBlocks
        ) {
          const teacherInfo = pickTeacher()
          day.push({ subject: subject.name, teacher: teacherInfo.teacher.name, color: subject.color })
          teacherInfo.remainingBlocks = Math.max(0, teacherInfo.remainingBlocks - 1)
          counts[dayIndex] += 1
          allocated++
        }
      })
    }

    if (allocated < weeklyBlocks) {
      throw new Error(`No hay bloques suficientes para asignar ${subject.name} en ${course.name}.`)
    }
  }

  try {
    for (const requirement of normalSubjects) {
      assignSubject(requirement, false)
    }

    dayPointer = 0
    for (const requirement of specialSubjects) {
      assignSubject(requirement, true)
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
  const { courses, subjects, teachers, levels, mode, courseId, config } = input

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
  const levelMap = new Map(levels.map((level) => [level.id, level.name]))
  const teacherCapacities = createTeacherCapacities(teachers, blockDuration)

  for (const course of workingCourses) {
    const { maxDailyBlocks, totalCapacity, cycleId } = calculateDailyCapacity(course, config, cycles, levels)
    const courseLevelId = course.levelId
    const courseLevelName = (levelMap.get(courseLevelId) ?? courseLevelId).toLowerCase()

    const requirements: SubjectRequirement[] = subjects
      .filter((subject) => {
        if (subject.levelIds.length === 0) {
          return false
        }

        if (subject.levelIds.includes(courseLevelId)) {
          return true
        }

        const subjectLevelNames = subject.levelIds.map((levelId) =>
          (levelMap.get(levelId) ?? levelId).toLowerCase()
        )

        return subjectLevelNames.includes(courseLevelName)
      })
      .map((subject) => ({
        subject,
        weeklyBlocks: getWeeklyBlocksForCycle(subject, cycleId)
      }))
      .filter((requirement) => requirement.weeklyBlocks > 0)

    const totalRequiredBlocks = requirements.reduce((acc, requirement) => acc + requirement.weeklyBlocks, 0)

    if (totalRequiredBlocks > totalCapacity) {
      return {
        error: `El ciclo asignado a ${course.name} solo permite ${totalCapacity} bloques a la semana, pero se requieren ${totalRequiredBlocks}. Ajusta los horarios del ciclo o la carga de asignaturas.`
      }
    }

    const grid = distributeSessions(course, requirements, teacherCapacities, WORKING_DAYS, maxDailyBlocks, cycleId)
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

