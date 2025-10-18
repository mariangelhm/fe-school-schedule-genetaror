import type { ConfigResponse } from '../services/configService'
import type { CourseData, SubjectData, TeacherData } from '../store/useSchedulerData'

export const WORKING_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const
export const LUNCH_LABEL = 'Hora de almuerzo'
export const ADMIN_LABEL = 'Horas administrativas'

export interface PreviewCell {
  subject: string
  teacher?: string
  course?: string
  color: string
  type?: 'class' | 'admin'
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

interface CourseAssignments {
  course: CourseData
  daySessions: SlotCell[][]
}

interface DaySlot {
  type: 'class' | 'lunch' | 'admin'
  start: number
  end: number
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
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB
}

function buildTimeline(
  course: CourseData,
  config: ConfigResponse
): { perDaySlots: DaySlot[][]; classSlotLimits: number[]; structure: ScheduleStructureRow[] } {
  const blockDuration = config.blockDuration ?? 45
  const dayStartMinutes = timeToMinutes(config.dayStart ?? '08:00')
  const lunchStartMinutes = config.lunchStart ? timeToMinutes(config.lunchStart) : null
  const lunchDuration = Math.max(0, config.lunchDuration ?? 0)
  const lunchEndMinutes = lunchStartMinutes !== null ? lunchStartMinutes + lunchDuration : null

  const schedule = config.levelSchedules?.find((entry) => entry.levelId === course.levelId)
  const fallbackEnd = dayStartMinutes + blockDuration * 8 + lunchDuration
  const dayEndMinutes = schedule?.endTime ? timeToMinutes(schedule.endTime) : fallbackEnd

  const perDaySlots: DaySlot[][] = WORKING_DAYS.map((day) => {
    const administrative = schedule?.administrativeBlocks?.filter((block) => block.day === day) ?? []
    const administrativeIntervals = administrative
      .map((block) => ({ start: timeToMinutes(block.start), end: timeToMinutes(block.end) }))
      .filter((interval) => interval.end > interval.start)

    const slots: DaySlot[] = []
    let pointer = dayStartMinutes

    while (pointer + blockDuration <= dayEndMinutes + 1) {
      const slotEnd = pointer + blockDuration
      let type: DaySlot['type'] = 'class'

      if (
        lunchStartMinutes !== null &&
        lunchDuration > 0 &&
        rangesOverlap(pointer, slotEnd, lunchStartMinutes, lunchEndMinutes ?? lunchStartMinutes)
      ) {
        type = 'lunch'
      } else if (
        administrativeIntervals.some((interval) => rangesOverlap(pointer, slotEnd, interval.start, interval.end))
      ) {
        type = 'admin'
      }

      slots.push({ type, start: pointer, end: slotEnd })
      pointer = slotEnd
    }

    return slots
  })

  const maxSlots = Math.max(...perDaySlots.map((slots) => slots.length))
  perDaySlots.forEach((slots) => {
    if (slots.length < maxSlots) {
      const last = slots[slots.length - 1]
      while (slots.length < maxSlots) {
        const start = last ? last.end : dayStartMinutes
        slots.push({ type: 'class', start, end: start + blockDuration })
      }
    }
  })

  const classSlotLimits = perDaySlots.map((slots) => slots.filter((slot) => slot.type === 'class').length)

  const structure: ScheduleStructureRow[] = []
  let classRowCounter = 0
  perDaySlots[0].forEach((slot) => {
    if (slot.type === 'class') {
      structure.push({
        kind: 'class',
        time: minutesToRange(slot.start, blockDuration),
        classRowIndex: classRowCounter
      })
      classRowCounter += 1
    } else {
      structure.push({
        kind: slot.type === 'lunch' ? 'lunch' : 'class',
        time: minutesToRange(slot.start, blockDuration)
      })
    }
  })

  return { perDaySlots, classSlotLimits, structure }
}

interface SubjectRequirement {
  subject: SubjectData
  weeklyBlocks: number
}

interface TeacherCapacity {
  teacher: TeacherData
  remainingBlocks: number
  subjectIds: Set<number>
  courseIds: Set<number>
}

function createTeacherCapacities(teachers: TeacherData[], blockDuration: number) {
  const map = new Map<number, TeacherCapacity>()
  teachers.forEach((teacher) => {
    const weeklyMinutes = Math.max(0, teacher.weeklyHours) * 60
    const capacity = Math.max(0, Math.floor(weeklyMinutes / blockDuration))
    map.set(teacher.id, {
      teacher,
      remainingBlocks: capacity,
      subjectIds: new Set(teacher.subjectIds),
      courseIds: new Set(teacher.courseIds)
    })
  })
  return map
}

function distributeSessions(
  course: CourseData,
  requirements: SubjectRequirement[],
  teacherCapacities: Map<number, TeacherCapacity>,
  days: readonly string[],
  classSlotLimits: number[]
): CourseAssignments | { error: string } {
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
      const candidates = Array.from(teacherCapacities.values()).filter((info) => {
        if (!info.subjectIds.has(subject.id)) {
          return false
        }
        if (info.teacher.levelId !== course.levelId) {
          return false
        }
        if (!info.courseIds.has(course.id)) {
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

      if (day.length >= (classSlotLimits[dayIndex] ?? 0) || counts[dayIndex] >= maxPerDay) {
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

        if (day.length >= (classSlotLimits[dayIndex] ?? 0) || counts[dayIndex] >= maxPerDay) {
          return
        }

        while (
          day.length < (classSlotLimits[dayIndex] ?? 0) &&
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

  const hasSessions = daySessions.some((sessions) => sessions.length > 0)
  if (!hasSessions) {
    return { error: `El curso ${course.name} no tiene bloques planificados.` }
  }

  return { course, daySessions }
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
        if (
          !cell ||
          cell.type === 'admin' ||
          cell.subject === LUNCH_LABEL ||
          !cell.teacher ||
          cell.teacher === 'Sin profesor asignado'
        ) {
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
        return (
          sum +
          row.cells.filter((cell) => cell && cell.type !== 'admin' && cell.subject !== LUNCH_LABEL).length
        )
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

  const courseTables: PreviewTable[] = []
  const teacherCapacities = createTeacherCapacities(teachers, blockDuration)

  for (const course of workingCourses) {
    const timeline = buildTimeline(course, config)
    const totalCapacity = timeline.classSlotLimits.reduce((acc, limit) => acc + limit, 0)

    const requirements: SubjectRequirement[] = subjects
      .filter((subject) => subject.levelId === course.levelId)
      .map((subject) => ({
        subject,
        weeklyBlocks: Math.max(0, Number(subject.weeklyBlocks) || 0)
      }))
      .filter((requirement) => requirement.weeklyBlocks > 0)

    const totalRequiredBlocks = requirements.reduce((acc, requirement) => acc + requirement.weeklyBlocks, 0)

    if (totalRequiredBlocks > totalCapacity) {
      return {
        error: `La jornada configurada para ${course.name} solo permite ${totalCapacity} bloques semanales, pero se requieren ${totalRequiredBlocks}. Ajusta las horas administrativas o la carga de asignaturas.`
      }
    }

    const assignments = distributeSessions(
      course,
      requirements,
      teacherCapacities,
      WORKING_DAYS,
      timeline.classSlotLimits
    )
    if ('error' in assignments) {
      return { error: assignments.error }
    }

    const lunchCell: PreviewCell = { subject: LUNCH_LABEL, color: '#f97316' }
    const adminCell: PreviewCell = { subject: ADMIN_LABEL, color: '#94a3b8', type: 'admin' }
    const dayClassPointers = WORKING_DAYS.map(() => 0)

    const rows: PreviewRow[] = timeline.structure.map((row, rowIndex) => {
      if (row.kind === 'lunch') {
        return {
          time: row.time,
          kind: 'lunch',
          cells: WORKING_DAYS.map((_, dayIndex) => {
            const slot = timeline.perDaySlots[dayIndex][rowIndex]
            return slot.type === 'lunch' ? lunchCell : null
          })
        }
      }

      return {
        time: row.time,
        kind: 'class',
        cells: WORKING_DAYS.map((_, dayIndex) => {
          const slot = timeline.perDaySlots[dayIndex][rowIndex]
          if (slot.type === 'admin') {
            return adminCell
          }
          if (slot.type === 'lunch') {
            return lunchCell
          }

          const classIndex = dayClassPointers[dayIndex]
          dayClassPointers[dayIndex] = classIndex + 1
          const assignment = assignments.daySessions[dayIndex][classIndex]
          return assignment
            ? { subject: assignment.subject, teacher: assignment.teacher, color: assignment.color, type: 'class' }
            : null
        })
      }
    })

    courseTables.push({
      id: course.id,
      name: course.name,
      rows
    })
  }

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

