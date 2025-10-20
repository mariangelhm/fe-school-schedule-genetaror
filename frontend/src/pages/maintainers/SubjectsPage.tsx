// Vista dedicada a mantener las asignaturas: garantiza unicidad por nivel y
// permite configurar cargas semanales, horarios preferentes y tipo.
import { FormEvent, useMemo, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import {
  useSchedulerDataStore,
  type SubjectData,
  type SubjectType,
  type SubjectPreferredTime,
  FIXED_LEVELS,
  DEFAULT_LEVEL_ID
} from '../../store/useSchedulerData'

interface SubjectDraft {
  name: string
  levelId: string
  type: SubjectType
  color: string
  weeklyBlocks: number
  maxDailyBlocks: number
  preferredTime: SubjectPreferredTime
}

// Función que genera el estado inicial del formulario de asignaturas.
function createEmptyDraft(levelId: string): SubjectDraft {
  return {
    name: '',
    levelId,
    type: 'Normal',
    color: '#2563eb',
    weeklyBlocks: 4,
    maxDailyBlocks: 2,
    preferredTime: 'any'
  }
}

// Componente que administra la creación y edición de asignaturas.
export function SubjectsPage() {
  const subjects = useSchedulerDataStore((state) => state.subjects)
  const levels = useSchedulerDataStore((state) => state.levels)
  const addSubject = useSchedulerDataStore((state) => state.addSubject)
  const updateSubject = useSchedulerDataStore((state) => state.updateSubject)
  const removeSubject = useSchedulerDataStore((state) => state.removeSubject)

  const levelOptions = useMemo(
    () => FIXED_LEVELS.map((level) => ({ id: level.id, name: level.name })),
    []
  )
  const levelNames = useMemo(() => new Map(levels.map((level) => [level.id, level.name])), [levels])
  const defaultLevel = levelOptions[0]?.id ?? DEFAULT_LEVEL_ID

  const [draft, setDraft] = useState<SubjectDraft>(() => createEmptyDraft(defaultLevel))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    const payload: Omit<SubjectData, 'id'> = {
      name: draft.name,
      levelId: levelOptions.some((option) => option.id === draft.levelId) ? draft.levelId : defaultLevel,
      type: draft.type,
      color: draft.color,
      weeklyBlocks: Math.max(1, Number(draft.weeklyBlocks) || 1),
      maxDailyBlocks: Math.max(1, Number(draft.maxDailyBlocks) || 1),
      preferredTime: draft.preferredTime
    }

    const success = editingId ? updateSubject(editingId, payload) : addSubject(payload)
    if (!success) {
      setError('Ya existe una asignatura con ese nombre en el nivel seleccionado.')
      return
    }

    setError(null)
    setDraft(createEmptyDraft(payload.levelId))
    setEditingId(null)
  }

  const handleEdit = (subject: SubjectData) => {
    setEditingId(subject.id)
    setDraft({
      name: subject.name,
      levelId: subject.levelId,
      type: subject.type,
      color: subject.color,
      weeklyBlocks: subject.weeklyBlocks,
      maxDailyBlocks: subject.maxDailyBlocks,
      preferredTime: subject.preferredTime
    })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(createEmptyDraft(defaultLevel))
    setError(null)
  }

  const handleDelete = (id: number) => {
    removeSubject(id)
    if (editingId === id) {
      handleCancel()
    }
  }

  return (
    <MaintenanceLayout
      title="Asignaturas"
      description="Administra la oferta académica del colegio, bloques semanales y límites diarios antes de generar horarios."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Bloques semanales</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Máx. diarios</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Tipo</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Preferencia</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {subjects.map((subject) => {
                const levelName = levelNames.get(subject.levelId) ?? subject.levelId
                return (
                  <tr key={subject.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
                        {subject.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">{levelName}</td>
                    <td className="px-4 py-3">{subject.weeklyBlocks}</td>
                    <td className="px-4 py-3">{subject.maxDailyBlocks}</td>
                    <td className="px-4 py-3">{subject.type}</td>
                    <td className="px-4 py-3">
                      {subject.preferredTime === 'morning'
                        ? 'Mañana'
                        : subject.preferredTime === 'afternoon'
                        ? 'Tarde'
                        : 'Indistinto'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          className="text-sm text-slate-500 transition hover:text-brand"
                          type="button"
                          onClick={() => handleEdit(subject)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-rose-500 transition hover:text-rose-600"
                          type="button"
                          onClick={() => handleDelete(subject.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay asignaturas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
        >
          <h2 className="text-lg font-semibold">{editingId ? 'Editar asignatura' : 'Nueva asignatura'}</h2>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nombre</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              maxLength={50}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nivel asociado</span>
            <select
              value={draft.levelId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  levelId: levelOptions.some((option) => option.id === event.target.value)
                    ? event.target.value
                    : DEFAULT_LEVEL_ID
                }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              {levelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Tipo</span>
            <select
              value={draft.type}
              onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as SubjectType }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="Normal">Normal</option>
              <option value="Especial">Especial</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Horario de preferencia</span>
            <select
              value={draft.preferredTime}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  preferredTime: event.target.value as SubjectPreferredTime
                }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="any">Indistinto</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Color</span>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
              className="h-10 w-20 cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Bloques semanales</span>
            <input
              type="number"
              min={1}
              value={draft.weeklyBlocks}
              onChange={(event) =>
                setDraft((current) => ({ ...current, weeklyBlocks: Math.max(1, Number(event.target.value) || 1) }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Máximo de bloques diarios</span>
            <input
              type="number"
              min={1}
              value={draft.maxDailyBlocks}
              onChange={(event) =>
                setDraft((current) => ({ ...current, maxDailyBlocks: Math.max(1, Number(event.target.value) || 1) }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Actualizar asignatura' : 'Guardar asignatura'}
            </button>
            {editingId && (
              <button type="button" className="text-sm text-slate-500 hover:text-slate-700" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </MaintenanceLayout>
  )
}
