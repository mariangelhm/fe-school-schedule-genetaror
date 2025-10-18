import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import type { DragEvent } from 'react'
import type { SchedulePreview } from '../utils/schedulePreview'
import { LUNCH_LABEL, syncPreview } from '../utils/schedulePreview'

interface SchedulePreviewModalProps {
  open: boolean
  preview: SchedulePreview | null
  onClose: () => void
  onConfirm: (preview: SchedulePreview) => void
  mode: 'full' | 'course'
  year: number
  onPreviewChange?: (preview: SchedulePreview) => void
}

export function SchedulePreviewModal({
  open,
  preview,
  onClose,
  onConfirm,
  mode,
  year,
  onPreviewChange
}: SchedulePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'teachers'>('courses')
  const [draftPreview, setDraftPreview] = useState<SchedulePreview | null>(preview)

  useEffect(() => {
    if (open) {
      setActiveTab('courses')
    }
  }, [open])

  useEffect(() => {
    setDraftPreview(preview)
  }, [preview])

  const handleSwap = (
    source: { tableId: number | string; rowIndex: number; columnIndex: number },
    target: { tableId: number | string; rowIndex: number; columnIndex: number }
  ) => {
    setDraftPreview((current) => {
      if (!current) {
        return current
      }

      if (
        source.tableId === target.tableId &&
        source.rowIndex === target.rowIndex &&
        source.columnIndex === target.columnIndex
      ) {
        return current
      }

      const nextCourses = current.courses.map((table) => ({
        ...table,
        rows: table.rows.map((row) => ({
          ...row,
          cells: [...row.cells]
        }))
      }))

      const sourceTable = nextCourses.find((table) => table.id === source.tableId)
      const targetTable = nextCourses.find((table) => table.id === target.tableId)

      if (!sourceTable || !targetTable) {
        return current
      }

      const sourceRow = sourceTable.rows[source.rowIndex]
      const targetRow = targetTable.rows[target.rowIndex]

      if (!sourceRow || !targetRow || sourceRow.kind !== 'class' || targetRow.kind !== 'class') {
        return current
      }

      const movingCell = sourceRow.cells[source.columnIndex]

      if (!movingCell) {
        return current
      }

      const receivingCell = targetRow.cells[target.columnIndex]

      sourceRow.cells[source.columnIndex] = receivingCell ?? null
      targetRow.cells[target.columnIndex] = movingCell

      const updated = syncPreview({ ...current, courses: nextCourses })
      onPreviewChange?.(updated)
      return updated
    })
  }

  if (!preview) {
    return null
  }

  const workingPreview = draftPreview ?? preview
  const { days, courses, teachers, summary, config } = workingPreview

  const tabs: Array<{ id: 'courses' | 'teachers'; label: string; count: number }> = [
    { id: 'courses', label: 'Por curso', count: courses.length },
    { id: 'teachers', label: 'Por profesor', count: teachers.length }
  ]

  const tables = activeTab === 'courses' ? courses : teachers
  const allowEditing = activeTab === 'courses'

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                      Previsualización del horario {mode === 'full' ? 'anual' : 'del curso'}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      Año académico {year}. Bloques de {config.blockDuration} minutos iniciando a las {config.dayStart} y almuerzo a las {config.lunchStart}.
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {summary.totalSessions} bloques planificados · {summary.totalCourses} cursos · {summary.totalTeachers} profesores
                    </p>
                    {allowEditing && (
                      <p className="mt-2 text-xs font-medium text-brand-dynamic/80 dark:text-brand/70">
                        Arrastra y suelta los bloques entre días o cursos antes de confirmar la generación.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring focus:ring-brand/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Cerrar previsualización"
                  >
                    ×
                  </button>
                </div>

                <div className="px-6 py-4">
                  <div className="mb-4 flex gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          activeTab === tab.id
                            ? 'bg-brand-dynamic text-white shadow'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {tab.label}
                        <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{tab.count}</span>
                      </button>
                    ))}
                  </div>

                  {tables.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                      No hay información disponible para esta vista todavía.
                    </p>
                  ) : (
                    <div className="grid gap-6">
                      {tables.map((table) => (
                        <div key={table.id} className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
                          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                            <span>{table.name}</span>
                            <span className="text-xs font-normal uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {days.length} días · {table.rows.length} bloques
                            </span>
                          </header>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                              <thead className="bg-white dark:bg-slate-900">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Horario</th>
                                  {days.map((day) => (
                                    <th key={day} className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">
                                      {day}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {table.rows.map((row, rowIndex) => (
                                  <tr key={`${table.id}-${row.time}`} className="bg-white dark:bg-slate-900/60">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                      {row.time}
                                    </th>
                                    {row.cells.map((cell, columnIndex) => {
                                      const isClassRow = row.kind === 'class'
                                      const cellKey = `${table.id}-${rowIndex}-${columnIndex}`

                                      const handleDragStart = (event: DragEvent<HTMLTableCellElement>) => {
                                        if (!allowEditing || !isClassRow || !cell) {
                                          return
                                        }

                                        const payload = JSON.stringify({
                                          tableId: table.id,
                                          rowIndex,
                                          columnIndex
                                        })

                                        event.dataTransfer.effectAllowed = 'move'
                                        event.dataTransfer.setData('application/json', payload)
                                        event.dataTransfer.setData('text/plain', payload)
                                      }

                                      const handleDropEvent = (event: DragEvent<HTMLTableCellElement>) => {
                                        if (!allowEditing || !isClassRow) {
                                          return
                                        }

                                        event.preventDefault()
                                        const data = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain')

                                        if (!data) {
                                          return
                                        }

                                        try {
                                          const parsed = JSON.parse(data) as {
                                            tableId: number | string
                                            rowIndex: number
                                            columnIndex: number
                                          }

                                          handleSwap(parsed, {
                                            tableId: table.id,
                                            rowIndex,
                                            columnIndex
                                          })
                                        } catch (error) {
                                          console.warn('No se pudo procesar el intercambio de bloques', error)
                                        }
                                      }

                                      const isLunchCell =
                                        row.kind === 'lunch' || cell?.subject === LUNCH_LABEL

                                      const isAdminCell = cell?.type === 'admin'

                                      return (
                                        <td
                                          key={cellKey}
                                          className={`px-4 py-3 align-top ${allowEditing && isClassRow ? 'cursor-move' : ''}`}
                                          draggable={allowEditing && isClassRow && Boolean(cell) && !isAdminCell && !isLunchCell}
                                          onDragStart={handleDragStart}
                                          onDragOver={(event) => {
                                            if (allowEditing && isClassRow) {
                                              event.preventDefault()
                                            }
                                          }}
                                          onDrop={handleDropEvent}
                                        >
                                          {isLunchCell ? (
                                            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold uppercase text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                                              {LUNCH_LABEL}
                                            </div>
                                          ) : isAdminCell ? (
                                            <div className="rounded border border-slate-300 bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                                              {cell.subject}
                                            </div>
                                          ) : cell ? (
                                            <div className="grid gap-1">
                                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                <span
                                                  className="h-3 w-3 rounded-full"
                                                  style={{ backgroundColor: cell.color }}
                                                  aria-hidden="true"
                                                />
                                                {cell.subject}
                                              </div>
                                              <p className="text-xs text-slate-500 dark:text-slate-300">
                                                {activeTab === 'courses' ? cell.teacher : cell.course}
                                              </p>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Confirma para generar y guardar los horarios en el backend.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirm(workingPreview)}
                      className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 focus:outline-none focus:ring focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Confirmar generación
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

