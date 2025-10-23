// Utilidades para construir una previsualización de horarios a partir de los
// datos del store y la configuración simulada. Se incluyen validaciones de
// negocio, asignación de profesores y resúmenes para el tablero.
import type { ConfigResponse } from '../services/configService'
import { FIXED_LEVELS, type CourseData, type SubjectData, type TeacherData } from '../store/useSchedulerData'

export const WORKING_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const
// Etiquetas utilizadas para identificar bloques especiales en la grilla.
export const LUNCH_LABEL = 'Hora de almuerzo'
export const ADMIN_LABEL = 'Horas administrativas'
export const BREAK_LABEL = 'Recreo'

export interface PreviewCell {
  subject: string
  teacher?: string
  course?: string
  color: string
  type?: 'class' | 'admin' | 'free' | 'lunch' | 'break'
}

export interface PreviewRow {
  time: string
  kind: 'class' | 'lunch' | 'break'
  cells: (PreviewCell | null)[]
}

export interface PreviewTable {
  id: number | string
  name: string
  rows: PreviewRow[]
}

export interface TeacherSummary {
  teacherId: number
  teacherName: string
  classMinutes: number
  administrativeMinutes: number
  subjectMinutes: { subject: string; minutes: number }[]
}

export interface SubjectTotal {
  subjectId: string
  subjectName: string
  minutes: number
}

export interface TeacherTag {
  teacherId: number
  teacherName: string
  color: string
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
  teacherSummaries: TeacherSummary[]
  subjectTotals: SubjectTotal[]
  teacherTags: TeacherTag[]
  schoolName: string
  levelId: string
  levelName: string
  config: {
    blockDuration: number
    dayStart: string
    lunchStart: string
    lunchDuration: number
  }
}

export interface BuildPreviewInput {
  levelId: string
  courses: CourseData[]
  subjects: SubjectData[]
  teachers: TeacherData[]
  config: ConfigResponse
}

interface DaySlot {
  type: 'class' | 'lunch' | 'admin' | 'break'
  start: number
  end: number
}

interface ClassSlotMeta {
  start: number
  end: number
  timeOfDay: 'morning' | 'afternoon'
}

interface ScheduleStructureRow {
  kind: 'class' | 'lunch' | 'break'
  time: string
}

interface TimelineData {
  perDaySlots: DaySlot[][]
  classSlots: ClassSlotMeta[][]
  structure: ScheduleStructureRow[]
  adminMinutes: number
  breakMinutes: number
}

interface SlotAssignment {
  subjectId: string
  subjectName: string
  color: string
  teacherId: number
  teacherName: string
}

interface TeacherCapacity {
  teacher: TeacherData
  remainingBlocks: number
  subjectIds: Set<string>
  courseIds: Set<number>
}

interface TeacherSlotRecord {
  teacherId: number
  teacherName: string
  rowIndex: number
  dayIndex: number
  subject: string
  color: string
  course: string
}

type TeacherAssignmentMatrix = Map<number, Map<number, Set<number>>>

// Función que convierte un texto HH:mm a su equivalente en minutos absolutos.
function timeToMinutes(time: string): number {
  const [hour = '0', minute = '0'] = time.split(':')
  return Number(hour) * 60 + Number(minute)
}

// Función que convierte minutos absolutos a un texto HH:mm formateado.
function minutesToTime(minutes: number): string {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hour = Math.floor(total / 60)
  const minute = total % 60
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`
}

// Función que devuelve el rango horario legible dado un inicio y una duración.
function minutesToRange(start: number, duration: number): string {
  return `${minutesToTime(start)} - ${minutesToTime(start + duration)}`
}

// Función que clasifica un bloque como mañana o tarde considerando el almuerzo.
function determineTimeOfDay(
  lunchStart: number | null,
  lunchEnd: number | null,
  slotStart: number,
  slotEnd: number
): 'morning' | 'afternoon' {
  if (lunchStart === null || lunchEnd === null) {
    return slotStart < 12 * 60 ? 'morning' : 'afternoon'
  }
  if (slotEnd <= lunchStart) {
    return 'morning'
  }
  if (slotStart >= lunchEnd) {
    return 'afternoon'
  }
  return slotStart < lunchStart ? 'morning' : 'afternoon'
}

// Función que detecta si dos rangos de tiempo se sobreponen.
function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB
}

// Función que construye la línea de tiempo diaria de un curso con bloques especiales.
function buildTimeline(course: CourseData, config: ConfigResponse): TimelineData {
  const blockDuration = Math.max(30, config.blockDuration ?? 45)
  const dayStartMinutes = timeToMinutes(config.dayStart ?? '08:00')
  const lunchStartMinutes = config.lunchStart ? timeToMinutes(config.lunchStart) : null
  const lunchDuration = Math.max(0, config.lunchDuration ?? 0)
  const lunchEndMinutes =
    lunchStartMinutes !== null ? lunchStartMinutes + lunchDuration : lunchStartMinutes

  const levelSchedule = config.levelSchedules?.find((entry) => entry.levelId === course.levelId)
  const dayEndMinutes = levelSchedule?.endTime
    ? timeToMinutes(levelSchedule.endTime)
    : dayStartMinutes + blockDuration * 8 + lunchDuration
  const breakEntries =
    levelSchedule?.breakMode === 'custom'
      ? (levelSchedule.breaks ?? [])
          .map((entry) => ({
            start: timeToMinutes(entry.start ?? '10:00'),
            duration: Math.max(0, Math.round(Number(entry.duration) || 0))
          }))
          .filter((entry) => entry.duration > 0)
      : []

  const perDaySlots: DaySlot[][] = []
  const classSlots: ClassSlotMeta[][] = []
  let adminMinutes = 0
  let breakMinutes = 0

  for (const day of WORKING_DAYS) {
    const administrativeBlocks = levelSchedule?.administrativeBlocks?.filter(
      (block) => block.day === day
    )
    const administrativeRanges = (administrativeBlocks ?? [])
      .map((block) => ({ start: timeToMinutes(block.start), end: timeToMinutes(block.end) }))
      .filter((range) => range.end > range.start)

    const breakRanges = breakEntries
      .map((entry) => ({
        type: 'break' as const,
        start: entry.start,
        end: entry.start + entry.duration
      }))
      .filter((range) => range.end > range.start && range.start >= dayStartMinutes && range.end <= dayEndMinutes + 1)

    const specialRanges = [
      ...administrativeRanges.map((range) => ({ type: 'admin' as const, ...range })),
      ...(lunchStartMinutes !== null && lunchDuration > 0
        ? [
            {
              type: 'lunch' as const,
              start: lunchStartMinutes,
              end: lunchEndMinutes ?? lunchStartMinutes
            }
          ]
        : []),
      ...breakRanges
    ].sort((a, b) => a.start - b.start)

    const daySlots: DaySlot[] = []
    const dayClassSlots: ClassSlotMeta[] = []
    let pointer = dayStartMinutes

    while (pointer < dayEndMinutes + 1) {
      const activeSpecial = specialRanges.find(
        (range) => pointer >= range.start && pointer < range.end
      )

      if (activeSpecial) {
        daySlots.push({ type: activeSpecial.type, start: activeSpecial.start, end: activeSpecial.end })
        if (activeSpecial.type === 'admin') {
          adminMinutes += activeSpecial.end - activeSpecial.start
        }
        if (activeSpecial.type === 'break') {
          breakMinutes += activeSpecial.end - activeSpecial.start
        }
        pointer = activeSpecial.end
        continue
      }

      const blockEnd = pointer + blockDuration
      if (blockEnd > dayEndMinutes + 1) {
        break
      }

      const nextSpecial = specialRanges.find((range) => range.start > pointer)
      if (nextSpecial && blockEnd > nextSpecial.start) {
        pointer = nextSpecial.start
        continue
      }

      daySlots.push({ type: 'class', start: pointer, end: blockEnd })
      dayClassSlots.push({
        start: pointer,
        end: blockEnd,
        timeOfDay: determineTimeOfDay(lunchStartMinutes, lunchEndMinutes, pointer, blockEnd)
      })
      pointer = blockEnd
    }

    perDaySlots.push(daySlots)
    classSlots.push(dayClassSlots)
  }

  const maxSlots = Math.max(...perDaySlots.map((slots) => slots.length))
  perDaySlots.forEach((slots, dayIndex) => {
    const dayClassSlots = classSlots[dayIndex]
    if (slots.length < maxSlots) {
      let pointer = slots[slots.length - 1]?.end ?? dayStartMinutes
      while (slots.length < maxSlots) {
        const slotEnd = pointer + blockDuration
        slots.push({ type: 'class', start: pointer, end: slotEnd })
        dayClassSlots.push({
          start: pointer,
          end: slotEnd,
          timeOfDay: determineTimeOfDay(lunchStartMinutes, lunchEndMinutes, pointer, slotEnd)
        })
        pointer = slotEnd
      }
    }
  })

  const structure: ScheduleStructureRow[] = perDaySlots[0].map((slot) => ({
    kind: slot.type === 'lunch' ? 'lunch' : slot.type === 'break' ? 'break' : 'class',
    time: minutesToRange(slot.start, slot.end - slot.start)
  }))

  return { perDaySlots, classSlots, structure, adminMinutes, breakMinutes }
}

// Función que normaliza la disponibilidad semanal de cada profesor en bloques.
function createTeacherCapacities(teachers: TeacherData[], blockDuration: number) {
  const map = new Map<number, TeacherCapacity>()
  teachers.forEach((teacher) => {
    if (!Array.isArray(teacher.courseIds) || teacher.courseIds.length === 0) {
      return
    }
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

// Función que selecciona al mejor profesor disponible para un bloque específico.
function pickTeacher(
  subjectId: string,
  courseId: number,
  teacherCapacities: Map<number, TeacherCapacity>,
  dayIndex: number,
  slotStart: number,
  teacherAssignments: TeacherAssignmentMatrix
): TeacherCapacity | null {
  const candidates = Array.from(teacherCapacities.values()).filter(
    (entry) => entry.subjectIds.has(subjectId) && entry.courseIds.has(courseId)
  )
  if (candidates.length === 0) {
    return null
  }
  candidates.sort((a, b) => b.remainingBlocks - a.remainingBlocks)
  for (const candidate of candidates) {
    if (candidate.remainingBlocks <= 0) {
      continue
    }
    const dayMap = teacherAssignments.get(candidate.teacher.id)
    const daySet = dayMap?.get(dayIndex)
    if (daySet && daySet.has(slotStart)) {
      continue
    }
    return candidate
  }
  return null
}

// Función que genera índices para localizar asignaturas y profesores válidos.
function buildCandidateIndexes(
  daySlots: ClassSlotMeta[],
  preferredTime: SubjectData['preferredTime'],
  isSpecial: boolean
) {
  const indexes = daySlots.map((_, index) => index)
  const sortFn = isSpecial ? (a: number, b: number) => b - a : (a: number, b: number) => a - b

  if (preferredTime === 'any') {
    return [...indexes].sort(sortFn)
  }

  const matchTime = preferredTime === 'morning' ? 'morning' : 'afternoon'
  const matching = indexes.filter((index) => daySlots[index].timeOfDay === matchTime)
  const remaining = indexes.filter((index) => !matching.includes(index))
  return [...matching.sort(sortFn), ...remaining.sort(sortFn)]
}

// Función que valida que no se excedan los bloques consecutivos por asignatura.
function violatesConsecutive(
  assignments: (SlotAssignment | null)[],
  slotIndex: number,
  subjectName: string
) {
  const prev = assignments[slotIndex - 1]
  const prevPrev = assignments[slotIndex - 2]
  return Boolean(prev && prevPrev && prev.subjectName === subjectName && prevPrev.subjectName === subjectName)
}

// Función que asigna las sesiones de un curso respetando reglas de disponibilidad.
function distributeCourse(
  course: CourseData,
  timeline: TimelineData,
  levelSubjects: SubjectData[],
  teacherCapacities: Map<number, TeacherCapacity>,
  blockDuration: number,
  teacherMinutes: Map<number, number>,
  teacherSubjectMinutes: Map<number, Map<string, number>>,
  subjectTotals: Map<string, number>,
  teacherAssignments: TeacherAssignmentMatrix
): { rows: PreviewRow[]; sessions: number; teacherSlots: TeacherSlotRecord[] } | { error: string } {
  const assignments: (SlotAssignment | null)[][] = timeline.classSlots.map((slots) =>
    Array.from({ length: slots.length }, () => null)
  )
  const subjectDailyCounts = new Map<string, number[]>()
  let sessions = 0

  const requirements = levelSubjects
    .map((subject) => ({
      subject,
      weeklyBlocks: Math.max(0, Number(subject.weeklyBlocks) || 0)
    }))
    .filter((item) => item.weeklyBlocks > 0)

  if (requirements.length === 0) {
    return { error: `El nivel ${course.levelId} no tiene asignaturas configuradas.` }
  }

  const totalRequiredBlocks = requirements.reduce((sum, item) => sum + item.weeklyBlocks, 0)
  const availableClassBlocks = timeline.classSlots.reduce((sum, slots) => sum + slots.length, 0)
  if (totalRequiredBlocks > availableClassBlocks) {
    return {
      error: `La carga semanal total excede los bloques disponibles para ${course.name}. Ajusta los horarios o la duración de la jornada.`
    }
  }

  for (const requirement of requirements) {
    const { subject, weeklyBlocks } = requirement
    const maxPerDay = Math.max(1, Number(subject.maxDailyBlocks) || 1)
    const counts = subjectDailyCounts.get(subject.id) ?? Array.from({ length: WORKING_DAYS.length }, () => 0)
    subjectDailyCounts.set(subject.id, counts)

    if (maxPerDay * WORKING_DAYS.length < weeklyBlocks) {
      return {
        error: `Los bloques diarios máximos de ${subject.name} impiden cumplir su carga semanal en ${course.name}. Ajusta la configuración antes de generar.`
      }
    }

    let allocated = 0
    let dayPointer = 0
    let guard = 0

    while (allocated < weeklyBlocks && guard < 2000) {
      const dayIndex = dayPointer % WORKING_DAYS.length
      const daySlots = timeline.classSlots[dayIndex]
      if (daySlots.length === 0) {
        dayPointer += 1
        guard += 1
        continue
      }

      const candidateIndexes = buildCandidateIndexes(
        daySlots,
        subject.preferredTime,
        subject.type === 'Especial'
      )
      let placed = false

      for (const slotIndex of candidateIndexes) {
        if (assignments[dayIndex][slotIndex]) {
          continue
        }
        if (counts[dayIndex] >= maxPerDay) {
          continue
        }
        if (violatesConsecutive(assignments[dayIndex], slotIndex, subject.name)) {
          continue
        }

        const slotMeta = daySlots[slotIndex]
        const teacherInfo = pickTeacher(
          subject.id,
          course.id,
          teacherCapacities,
          dayIndex,
          slotMeta.start,
          teacherAssignments
        )
        if (!teacherInfo) {
          continue
        }

        assignments[dayIndex][slotIndex] = {
          subjectId: subject.id,
          subjectName: subject.name,
          color: subject.color,
          teacherId: teacherInfo.teacher.id,
          teacherName: teacherInfo.teacher.name
        }
        teacherInfo.remainingBlocks = Math.max(0, teacherInfo.remainingBlocks - 1)

        const dayMap = teacherAssignments.get(teacherInfo.teacher.id) ?? new Map<number, Set<number>>()
        const daySet = dayMap.get(dayIndex) ?? new Set<number>()
        daySet.add(slotMeta.start)
        dayMap.set(dayIndex, daySet)
        teacherAssignments.set(teacherInfo.teacher.id, dayMap)

        const minutes = blockDuration
        const totalMinutes = teacherMinutes.get(teacherInfo.teacher.id) ?? 0
        teacherMinutes.set(teacherInfo.teacher.id, totalMinutes + minutes)
        const perSubject = teacherSubjectMinutes.get(teacherInfo.teacher.id) ?? new Map<string, number>()
        perSubject.set(subject.id, (perSubject.get(subject.id) ?? 0) + minutes)
        teacherSubjectMinutes.set(teacherInfo.teacher.id, perSubject)
        subjectTotals.set(subject.id, (subjectTotals.get(subject.id) ?? 0) + minutes)

        counts[dayIndex] += 1
        allocated += 1
        sessions += 1
        placed = true
        break
      }

      if (!placed) {
        dayPointer += 1
      }
      dayPointer += 1
      guard += 1
    }

    if (allocated < weeklyBlocks) {
      return {
        error: `No fue posible asignar todos los bloques de ${subject.name} para ${course.name}. Ajusta la carga horaria o los profesores disponibles.`
      }
    }
  }

  const lunchCell: PreviewCell = { subject: LUNCH_LABEL, color: '#f97316', type: 'lunch' }
  const adminCell: PreviewCell = { subject: ADMIN_LABEL, color: '#94a3b8', type: 'admin' }
  const breakCell: PreviewCell = { subject: BREAK_LABEL, color: '#facc15', type: 'break' }
  const freeCell: PreviewCell = { subject: 'Sin clase', color: '#e2e8f0', type: 'free' }
  const classPointers = timeline.classSlots.map(() => 0)
  const teacherSlots: TeacherSlotRecord[] = []

  const rows: PreviewRow[] = timeline.structure.map((row, rowIndex) => {
    if (row.kind === 'lunch') {
      return {
        time: row.time,
        kind: 'lunch',
        cells: WORKING_DAYS.map(() => lunchCell)
      }
    }
    if (row.kind === 'break') {
      return {
        time: row.time,
        kind: 'class',
        cells: WORKING_DAYS.map(() => breakCell)
      }
    }

    return {
      time: row.time,
      kind: 'class',
      cells: WORKING_DAYS.map((_, dayIndex) => {
        const slot = timeline.perDaySlots[dayIndex][rowIndex]
        if (!slot) {
          return freeCell
        }
        if (slot.type === 'admin') {
          return adminCell
        }
        if (slot.type === 'lunch') {
          return lunchCell
        }
        if (slot.type === 'break') {
          return breakCell
        }

        const pointer = classPointers[dayIndex]
        const assignment = assignments[dayIndex][pointer] ?? null
        classPointers[dayIndex] = pointer + 1

        if (!assignment) {
          return freeCell
        }

        teacherSlots.push({
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          rowIndex,
          dayIndex,
          subject: assignment.subjectName,
          color: assignment.color,
          course: course.name
        })

        return {
          subject: assignment.subjectName,
          teacher: assignment.teacherName,
          color: assignment.color,
          type: 'class'
        }
      })
    }
  })

  return { rows, sessions, teacherSlots }
}

// Función que crea un color identificador estable para cada etiqueta de profesor.
function generateTagColor(index: number): string {
  const hue = (index * 67) % 360
  return `hsl(${hue} 70% 45%)`
}

// Función principal que genera la previsualización completa para un nivel dado.
export function buildSchedulePreview(
  input: BuildPreviewInput
): { preview?: SchedulePreview; error?: string } {
  const { levelId, courses, subjects, teachers, config } = input
  if (!levelId) {
    return { error: 'Selecciona un nivel para generar la previsualización.' }
  }

  const levelName = FIXED_LEVELS.find((level) => level.id === levelId)?.name ?? levelId
  const levelCourses = courses.filter((course) => course.levelId === levelId)
  if (levelCourses.length === 0) {
    return { error: 'No existen cursos registrados para el nivel seleccionado.' }
  }

  const levelSubjects = subjects.filter((subject) => subject.levelId === levelId)
  if (levelSubjects.length === 0) {
    return { error: 'Agrega asignaturas al nivel antes de generar horarios.' }
  }

  const levelTeachers = teachers.filter((teacher) => teacher.levelId === levelId)
  if (levelTeachers.length === 0) {
    return { error: 'Registra profesores asociados al nivel seleccionado.' }
  }

  const blockDuration = Math.max(30, config.blockDuration ?? 45)
  const dayStart = config.dayStart ?? '08:00'
  const lunchStart = config.lunchStart ?? '13:00'
  const lunchDuration = Math.max(0, config.lunchDuration ?? 60)
  const schoolName = config.schoolName ?? 'School Scheduler'

  const teacherCapacities = createTeacherCapacities(levelTeachers, blockDuration)
  if (teacherCapacities.size === 0) {
    return { error: 'Asigna cursos a los profesores para continuar con la generación.' }
  }

  const teacherMinutes = new Map<number, number>()
  const teacherSubjectMinutes = new Map<number, Map<string, number>>()
  const subjectTotals = new Map<string, number>()
  const teacherAssignments: TeacherAssignmentMatrix = new Map()
  const teacherSlotRecords: TeacherSlotRecord[] = []
  let referenceTimeline: TimelineData | null = null
  const courseTables: PreviewTable[] = []
  let totalSessions = 0

  for (const course of levelCourses) {
    const timeline = buildTimeline(course, config)
    if (!referenceTimeline) {
      referenceTimeline = timeline
    }

    const result = distributeCourse(
      course,
      timeline,
      levelSubjects,
      teacherCapacities,
      blockDuration,
      teacherMinutes,
      teacherSubjectMinutes,
      subjectTotals,
      teacherAssignments
    )

    if ('error' in result) {
      return { error: result.error }
    }

    courseTables.push({ id: course.id, name: course.name, rows: result.rows })
    teacherSlotRecords.push(...result.teacherSlots)
    totalSessions += result.sessions
  }

  if (!referenceTimeline) {
    return { error: 'No fue posible construir la jornada para el nivel seleccionado.' }
  }

  const teacherSlotsById = new Map<number, TeacherSlotRecord[]>()
  levelTeachers.forEach((teacher) => {
    teacherSlotsById.set(teacher.id, [])
  })
  teacherSlotRecords.forEach((record) => {
    const list = teacherSlotsById.get(record.teacherId) ?? []
    list.push(record)
    teacherSlotsById.set(record.teacherId, list)
  })

  const teacherTables: PreviewTable[] = levelTeachers.map((teacher) => {
    const records = teacherSlotsById.get(teacher.id) ?? []
    const grid: PreviewCell[][] = referenceTimeline!.structure.map((row, rowIndex): PreviewCell[] => {
      if (row.kind === 'lunch') {
        return Array.from({ length: WORKING_DAYS.length }, () => ({
          subject: LUNCH_LABEL,
          color: '#f97316',
          type: 'lunch' as const
        }))
      }
      if (row.kind === 'break') {
        return Array.from({ length: WORKING_DAYS.length }, () => ({
          subject: BREAK_LABEL,
          color: '#facc15',
          type: 'break' as const
        }))
      }
      return referenceTimeline!.perDaySlots.map((daySlots, dayIndex) => {
        const slot = daySlots[rowIndex]
        if (!slot || slot.type === 'admin') {
          return {
            subject: ADMIN_LABEL,
            color: '#94a3b8',
            type: 'admin' as const
          }
        }
        if (slot.type === 'break') {
          return {
            subject: BREAK_LABEL,
            color: '#facc15',
            type: 'break' as const
          }
        }
        return {
          subject: 'Sin clase',
          color: '#e2e8f0',
          type: 'free' as const
        }
      })
    })

      records.forEach((record) => {
        const row = grid[record.rowIndex]
        if (!row) {
          return
        }
        row[record.dayIndex] = {
          subject: record.subject,
          course: record.course,
          color: record.color,
          type: 'class'
        }
      })

      return {
        id: teacher.id,
        name: teacher.name,
        rows: referenceTimeline!.structure.map((row, rowIndex) => ({
          time: row.time,
          kind: row.kind,
          cells: grid[rowIndex]
        }))
      }
  })

  const administrativeMinutes = referenceTimeline.adminMinutes
  const teacherSummaries: TeacherSummary[] = levelTeachers.map((teacher, index) => {
    const classMinutes = teacherMinutes.get(teacher.id) ?? 0
    const perSubject = teacherSubjectMinutes.get(teacher.id) ?? new Map<string, number>()
    const subjectEntries = Array.from(perSubject.entries()).map(([subjectId, minutes]) => {
      const subjectName = levelSubjects.find((subject) => subject.id === subjectId)?.name ?? 'Asignatura'
      return { subject: subjectName, minutes }
    })
    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      classMinutes,
      administrativeMinutes,
      subjectMinutes: subjectEntries
    }
  })

  const subjectTotalsList: SubjectTotal[] = Array.from(subjectTotals.entries()).map(
    ([subjectId, minutes]) => {
      const subjectName = levelSubjects.find((subject) => subject.id === subjectId)?.name ?? 'Asignatura'
      return { subjectId, subjectName, minutes }
    }
  )

  const teacherTags: TeacherTag[] = teacherSummaries.map((summary, index) => ({
    teacherId: summary.teacherId,
    teacherName: summary.teacherName,
    color: generateTagColor(index)
  }))

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
      teacherSummaries,
      subjectTotals: subjectTotalsList,
      teacherTags,
      schoolName,
      levelId,
      levelName,
      config: {
        blockDuration,
        dayStart,
        lunchStart,
        lunchDuration
      }
    }
  }
}

// Alias conservado para instalaciones que aún importan la función antigua
// `syncPreview`. Mantiene exactamente el mismo comportamiento al delegar en
// `buildSchedulePreview`.
export const syncPreview = buildSchedulePreview
