// Componente legado para mantener compatibilidad con implementaciones previas
// que esperaban una previsualización en formato modal. Actualmente reutiliza
// el panel en página y simplemente delega el renderizado si existe contenido.
import type { SchedulePreview } from '../utils/schedulePreview'
import { SchedulePreviewPanel } from './SchedulePreviewPanel'

interface SchedulePreviewModalProps {
  preview: SchedulePreview | null
  onClose?: () => void
}

export function SchedulePreviewModal({ preview, onClose }: SchedulePreviewModalProps) {
  if (!preview) {
    return null
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Previsualización de horarios
        </h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Cerrar
          </button>
        ) : null}
      </div>
      <SchedulePreviewPanel preview={preview} />
    </div>
  )
}
