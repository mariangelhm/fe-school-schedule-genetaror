// Componente encargado de mostrar la previsualización generada, incluyendo
// filtros por curso/profesor, resúmenes y exportación simple a PDF.
import { useMemo, useState } from 'react'
import type { PreviewTable, SchedulePreview } from '../utils/schedulePreview'

interface SchedulePreviewPanelProps {
  preview: SchedulePreview
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours === 0) {
    return `${remaining} min`
  }
  if (remaining === 0) {
    return `${hours} h`
  }
  return `${hours} h ${remaining} min`
}

function getCellBackground(cell: PreviewTable['rows'][number]['cells'][number] | null) {
  if (!cell) {
    return '#f8fafc'
  }
  if (cell.type === 'class') {
    return cell.color
  }
  if (cell.type === 'admin') {
    return '#cbd5f5'
  }
  if (cell.type === 'lunch') {
    return '#f97316'
  }
  if (cell.type === 'break') {
    return '#facc15'
  }
  return '#f1f5f9'
}

// Genera un documento PDF en orientación horizontal con una página por curso y
// otra por profesor, incluyendo resúmenes y encabezados institucionales.
function exportPreviewAsPdf(preview: SchedulePreview) {
  if (typeof window === 'undefined') {
    return
  }
  const printable = window.open('', '_blank', 'width=1280,height=900')
  if (!printable) {
    return
  }
  const { document } = printable
  const title = `${preview.schoolName} - ${preview.levelName}`
  const blockDuration = Math.max(1, preview.config.blockDuration ?? 45)
  const generationDate = new Date().toLocaleDateString('es-CL')
  const teacherSummaryMap = new Map<string, (typeof preview.teacherSummaries)[number]>()
  preview.teacherSummaries.forEach((summary) => {
    teacherSummaryMap.set(`${summary.teacherId}`, summary)
  })

  const legendHtml = `
    <div class="legend">
      <span><span class="legend-dot legend-dot--class"></span> Clase</span>
      <span><span class="legend-dot" style="background:#facc15;"></span> Recreo</span>
      <span><span class="legend-dot" style="background:#f97316;"></span> Almuerzo</span>
      <span><span class="legend-dot" style="background:#cbd5f5;"></span> Hora administrativa</span>
      <span><span class="legend-dot" style="background:#e2e8f0;"></span> Sin clase</span>
    </div>
  `

  const buildHeader = (subtitle: string, badgeLabel: string) => `
    <header class="page-header">
      <div>
        <p class="org-name">${preview.schoolName}</p>
        <p class="meta">Nivel ${preview.levelName} • Generado ${generationDate}</p>
        <h2 class="section-title">${subtitle}</h2>
      </div>
      <div class="badge badge--headline">${badgeLabel}</div>
    </header>
  `

  const buildTable = (table: PreviewTable) => {
    const headerCells = preview.days
      .map((day) => `<th class="day-heading">${day}</th>`)
      .join('')
    const rowsHtml = table.rows
      .map((row) => {
        const cells = row.cells
          .map((cell) => {
            const background = getCellBackground(cell ?? null)
            const isClass = cell?.type === 'class'
            const textColor = isClass ? '#ffffff' : '#0f172a'
            const metaColor = isClass ? 'rgba(255,255,255,0.85)' : '#475569'
            const subject = cell?.subject ?? 'Sin clase'
            const teacher = cell?.teacher
              ? `<div class="cell-meta" style="color:${metaColor};">${cell.teacher}</div>`
              : ''
            const course = cell?.course
              ? `<div class="cell-meta" style="color:${metaColor};">${cell.course}</div>`
              : ''
            return `<td style="background:${background};color:${textColor};"><div class="cell-main">${subject}</div>${teacher}${course}</td>`
          })
          .join('')
        return `<tr><td class="time-cell">${row.time}</td>${cells}</tr>`
      })
      .join('')
    return `<div class="table-wrapper"><table><thead><tr><th class="day-heading">Horario</th>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`
  }

  const buildCourseSummary = (table: PreviewTable) => {
    const subjectMinutes = new Map<string, number>()
    const teacherSet = new Set<string>()
    let adminBlocks = 0
    let breakBlocks = 0
    let classBlocks = 0

    table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (!cell) {
          return
        }
        if (cell.type === 'class') {
          classBlocks += 1
          subjectMinutes.set(
            cell.subject,
            (subjectMinutes.get(cell.subject) ?? 0) + blockDuration
          )
          if (cell.teacher) {
            teacherSet.add(cell.teacher)
          }
        } else if (cell.type === 'admin') {
          adminBlocks += 1
        } else if (cell.type === 'break') {
          breakBlocks += 1
        }
      })
    })

    const classMinutes = classBlocks * blockDuration
    const adminMinutes = adminBlocks * blockDuration
    const breakMinutes = breakBlocks * blockDuration

    const subjectsHtml = subjectMinutes.size
      ? `<ul>${Array.from(subjectMinutes.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([subject, minutes]) => `<li><strong>${subject}:</strong> ${formatMinutes(minutes)}</li>`)
          .join('')}</ul>`
      : '<p class="muted">Sin clases asignadas.</p>'

    const teachersHtml = teacherSet.size
      ? Array.from(teacherSet)
          .sort()
          .map((teacher) => `<span class="badge">${teacher}</span>`)
          .join(' ')
      : '<span class="muted">Profesores no asignados</span>'

    return `
      <div class="summary-card">
        <h4>Resumen del curso</h4>
        <div class="summary-grid">
          <div>
            <p><strong>Horas de clase:</strong> ${formatMinutes(classMinutes)}</p>
            <p><strong>Horas administrativas:</strong> ${formatMinutes(adminMinutes)}</p>
            <p><strong>Tiempo de recreos:</strong> ${formatMinutes(breakMinutes)}</p>
          </div>
          <div>
            <p><strong>Docentes asignados:</strong></p>
            <div class="badges">${teachersHtml}</div>
          </div>
        </div>
        <div class="summary-detail">
          <h5>Distribución de asignaturas</h5>
          ${subjectsHtml}
        </div>
      </div>
    `
  }

  const buildTeacherSummary = (table: PreviewTable) => {
    const summary = teacherSummaryMap.get(`${table.id}`)
    const courseSet = new Set<string>()
    let breakBlocks = 0

    table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell?.course) {
          courseSet.add(cell.course)
        }
        if (cell?.type === 'break') {
          breakBlocks += 1
        }
      })
    })

    const breakMinutes = breakBlocks * blockDuration
    const classMinutes = summary?.classMinutes ?? 0
    const adminMinutes = summary?.administrativeMinutes ?? 0
    const subjectList = summary?.subjectMinutes.length
      ? `<ul>${summary.subjectMinutes
          .map((entry) => `<li><strong>${entry.subject}:</strong> ${formatMinutes(entry.minutes)}</li>`)
          .join('')}</ul>`
      : '<p class="muted">Sin asignaturas registradas.</p>'
    const coursesHtml = courseSet.size
      ? Array.from(courseSet)
          .sort()
          .map((course) => `<span class="badge">${course}</span>`)
          .join(' ')
      : '<span class="muted">Cursos sin asignar</span>'

    return `
      <div class="summary-card">
        <h4>Resumen del profesor</h4>
        <div class="summary-grid">
          <div>
            <p><strong>Horas de clase:</strong> ${formatMinutes(classMinutes)}</p>
            <p><strong>Horas administrativas:</strong> ${formatMinutes(adminMinutes)}</p>
            <p><strong>Tiempo de recreos:</strong> ${formatMinutes(breakMinutes)}</p>
          </div>
          <div>
            <p><strong>Cursos atendidos:</strong></p>
            <div class="badges">${coursesHtml}</div>
          </div>
        </div>
        <div class="summary-detail">
          <h5>Detalle por asignatura</h5>
          ${subjectList}
        </div>
      </div>
    `
  }

  const courseSections = preview.courses
    .map(
      (table) => `
        <section class="print-section">
          ${buildHeader('Horario semanal del curso', table.name)}
          ${legendHtml}
          ${buildTable(table)}
          ${buildCourseSummary(table)}
        </section>
      `
    )
    .join('')

  const teacherSections = preview.teachers
    .map(
      (table) => `
        <section class="print-section">
          ${buildHeader('Horario semanal del profesor', table.name)}
          ${legendHtml}
          ${buildTable(table)}
          ${buildTeacherSummary(table)}
        </section>
      `
    )
    .join('')

  const styles = `
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 24px; background: #e2e8f0; color: #0f172a; }
      .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
      .org-name { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.01em; }
      .meta { margin: 4px 0 8px; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
      .section-title { margin: 0; font-size: 18px; font-weight: 600; }
      .badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 9999px; padding: 6px 14px; font-size: 12px; font-weight: 600; background: #0f172a; color: #ffffff; text-transform: uppercase; letter-spacing: 0.08em; }
      .badge--headline { background: linear-gradient(135deg, #1d4ed8, #7c3aed); }
      .print-section { background: #ffffff; padding: 24px; border-radius: 16px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12); margin-bottom: 32px; page-break-after: always; }
      .print-section:last-of-type { page-break-after: auto; }
      .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; font-size: 11px; color: #475569; }
      .legend-dot { display: inline-block; width: 14px; height: 14px; border-radius: 4px; border: 1px solid rgba(15, 23, 42, 0.12); }
      .legend-dot--class { background: linear-gradient(135deg, #2563eb, #9333ea); }
      .table-wrapper { border: 1px solid #cbd5f5; border-radius: 12px; overflow: hidden; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; }
      thead { background: #e2e8f0; }
      th { padding: 8px; text-align: left; font-weight: 600; color: #1e293b; }
      td { padding: 8px; border-top: 1px solid #cbd5f5; vertical-align: top; }
      .time-cell { background: #cbd5f5; font-weight: 600; color: #0f172a; width: 120px; }
      .cell-main { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
      .cell-meta { font-size: 11px; }
      .summary-card { margin-top: 20px; border: 1px solid #cbd5f5; border-radius: 12px; padding: 16px; background: #f8fafc; }
      .summary-card h4 { margin: 0 0 12px; font-size: 14px; }
      .summary-card h5 { margin: 16px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; font-size: 12px; }
      .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
      .muted { color: #64748b; font-size: 12px; }
      ul { margin: 0; padding-left: 18px; }
      li { margin-bottom: 4px; }
      @media print {
        body { padding: 12mm; background: #ffffff; }
        .print-section { box-shadow: none; border: 1px solid #cbd5f5; }
      }
    </style>
  `

  document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body>${courseSections}${teacherSections}</body></html>`)
  document.close()
  printable.focus()
  printable.print()
}

function renderTable(table: PreviewTable, days: readonly string[]) {
  return (
    <div key={table.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
        {table.name}
      </div>
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800/60">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Horario</th>
              {days.map((day) => (
                <th key={day} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.id}-${rowIndex}`} className="border-b border-slate-200 dark:border-slate-800/70">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-600 dark:text-slate-300">
                  {row.time}
                </td>
                {row.cells.map((cell, cellIndex) => {
                  const background = getCellBackground(cell)
                  const textColor = cell?.type === 'class' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                  return (
                    <td
                      key={`${table.id}-${rowIndex}-${cellIndex}`}
                      className={`align-top px-3 py-2 ${textColor}`}
                      style={{ background }}
                    >
                      <div className="grid gap-1">
                        <span className="font-semibold text-sm">{cell?.subject ?? 'Sin clase'}</span>
                        {cell?.teacher && (
                          <span className="text-xs text-slate-700 dark:text-slate-200">{cell.teacher}</span>
                        )}
                        {cell?.course && (
                          <span className="text-xs text-slate-600 dark:text-slate-300">{cell.course}</span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SchedulePreviewPanel({ preview }: SchedulePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'teachers'>('courses')
  const [courseFilter, setCourseFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)

  const filteredCourses = useMemo(() => {
    const normalised = courseFilter.trim().toLowerCase()
    if (!normalised) {
      return preview.courses
    }
    return preview.courses.filter((course) => course.name.toLowerCase().includes(normalised))
  }, [courseFilter, preview.courses])

  const filteredTeachers = useMemo(() => {
    const normalised = teacherFilter.trim().toLowerCase()
    return preview.teachers.filter((teacher) => {
      if (selectedTeacherId !== null && `${teacher.id}` !== `${selectedTeacherId}`) {
        return false
      }
      if (!normalised) {
        return true
      }
      return teacher.name.toLowerCase().includes(normalised)
    })
  }, [preview.teachers, teacherFilter, selectedTeacherId])

  const totalClassMinutes = useMemo(
    () => preview.teacherSummaries.reduce((acc, summary) => acc + summary.classMinutes, 0),
    [preview.teacherSummaries]
  )

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {preview.schoolName}
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Previsualización nivel {preview.levelName}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Revisa la distribución semanal antes de confirmar la generación definitiva.
          </p>
        </div>
        <button
          onClick={() => exportPreviewAsPdf(preview)}
          className="h-fit rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
        >
          Exportar a PDF
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cursos considerados</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{preview.summary.totalCourses}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Profesores con bloques</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{preview.summary.totalTeachers}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Bloques asignados</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{preview.summary.totalSessions}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('courses')}
          className={`rounded px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'courses'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          Ver por curso
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`rounded px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'teachers'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          Ver por profesor
        </button>
      </div>

      {activeTab === 'courses' ? (
        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Buscar curso</span>
            <input
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              maxLength={50}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="Nombre del curso"
            />
          </label>
          <div className="grid gap-4">
            {filteredCourses.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-300">No hay cursos que coincidan con la búsqueda.</p>
            )}
            {filteredCourses.map((table) => renderTable(table, preview.days))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {preview.teacherTags.map((tag) => (
              <button
                key={tag.teacherId}
                onClick={() =>
                  setSelectedTeacherId((current) => (current === tag.teacherId ? null : tag.teacherId))
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition ${
                  selectedTeacherId === tag.teacherId ? 'ring-2 ring-offset-2 ring-white/70' : ''
                }`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.teacherName}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Buscar profesor</span>
            <input
              value={teacherFilter}
              onChange={(event) => setTeacherFilter(event.target.value)}
              maxLength={50}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="Nombre del profesor"
            />
          </label>
          <div className="grid gap-4">
            {filteredTeachers.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-300">No hay profesores que coincidan con los filtros.</p>
            )}
            {filteredTeachers.map((table) => renderTable(table, preview.days))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resumen por profesor</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Carga total semanal: {formatMinutes(totalClassMinutes)}
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="pb-2">Profesor</th>
                <th className="pb-2">Horas clase</th>
                <th className="pb-2">Horas adm.</th>
                <th className="pb-2">Detalle asignaturas</th>
              </tr>
            </thead>
            <tbody>
              {preview.teacherSummaries.map((summary) => (
                <tr key={summary.teacherId} className="border-t border-slate-200 text-xs dark:border-slate-800">
                  <td className="py-2 font-medium text-slate-700 dark:text-slate-200">{summary.teacherName}</td>
                  <td className="py-2">{formatMinutes(summary.classMinutes)}</td>
                  <td className="py-2">{formatMinutes(summary.administrativeMinutes)}</td>
                  <td className="py-2">
                    {summary.subjectMinutes.length === 0 ? (
                      <span className="text-slate-500 dark:text-slate-400">Sin clases asignadas</span>
                    ) : (
                      <ul className="space-y-1">
                        {summary.subjectMinutes.map((entry) => (
                          <li key={`${summary.teacherId}-${entry.subject}`}> 
                            <span className="font-medium">{entry.subject}:</span> {formatMinutes(entry.minutes)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Carga por asignatura</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {preview.subjectTotals.length === 0 && (
              <li className="text-slate-500 dark:text-slate-400">No se registraron bloques asignados.</li>
            )}
            {preview.subjectTotals.map((subject) => (
              <li key={subject.subjectId} className="flex items-center justify-between rounded bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <span>{subject.subjectName}</span>
                <span className="font-semibold">{formatMinutes(subject.minutes)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
