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
  return '#f1f5f9'
}

function exportPreviewAsPdf(preview: SchedulePreview) {
  if (typeof window === 'undefined') {
    return
  }
  const printable = window.open('', '_blank', 'width=1200,height=800')
  if (!printable) {
    return
  }
  const { document } = printable
  const title = `${preview.schoolName} - ${preview.levelName}`
  const tablesHtml = [...preview.courses, ...preview.teachers]
    .map((table) => {
      const header = preview.days.map((day) => `<th style="padding:8px;border:1px solid #94a3b8;">${day}</th>`).join('')
      const rows = table.rows
        .map((row) => {
          const cells = row.cells
            .map((cell) => {
              const bg = getCellBackground(cell)
              const subject = cell?.subject ?? 'Sin clase'
              const teacher = cell?.teacher ? `<div style="font-size:11px;color:#0f172a;">${cell.teacher}</div>` : ''
              const course = cell?.course ? `<div style="font-size:11px;color:#475569;">${cell.course}</div>` : ''
              return `<td style="padding:6px;border:1px solid #94a3b8;background:${bg};"><div style="font-size:12px;font-weight:600;">${subject}</div>${teacher}${course}</td>`
            })
            .join('')
          return `<tr><td style="padding:6px;border:1px solid #94a3b8;background:#e2e8f0;font-weight:600;">${row.time}</td>${cells}</tr>`
        })
        .join('')
      return `<section style="margin-bottom:24px;"><h3 style="margin-bottom:8px;font-size:16px;">${table.name}</h3><table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;font-size:12px;"><thead><tr><th style="padding:6px;border:1px solid #94a3b8;background:#e2e8f0;">Horario</th>${header}</tr></thead><tbody>${rows}</tbody></table></section>`
    })
    .join('')

  document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:Arial, sans-serif;padding:24px;background:#f8fafc;color:#0f172a;"><h1 style="margin-top:0;">${preview.schoolName}</h1><h2 style="margin-top:0;font-size:18px;">Previsualización ${preview.levelName}</h2>${tablesHtml}</body></html>`)
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
                  const textColor = cell?.type === 'class' ? 'text-white' : 'text-slate-700 dark:text-slate-200'
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
