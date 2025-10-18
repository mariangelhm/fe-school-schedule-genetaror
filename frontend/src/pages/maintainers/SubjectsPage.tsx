import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'
import { fetchConfig, type CycleConfig } from '../../services/configService'
import {
  useSchedulerDataStore,
  type SubjectCycleLoad,
  type SubjectData,
  type SubjectType,
  FIXED_LEVELS,
  DEFAULT_LEVEL_ID
} from '../../store/useSchedulerData'

interface SubjectDraft {
  name: string
  levelIds: string[]
  type: SubjectType
  color: string
  maxDailyBlocks: number
  cycleLoads: Record<string, number>
}

const placeholderCycles: CycleConfig[] = [
  {
    id: 'ciclo-basico-i',
    name: 'Ciclo Básico I',
    levels: ['1° Básico', '2° Básico', '3° Básico'],
    endTime: '13:00'
  }
]

function createEmptyDraft(cycles: CycleConfig[], levelIds: string[]): SubjectDraft {
  const cycleLoads = cycles.reduce<Record<string, number>>((acc, cycle) => {
    acc[cycle.id] = 4
    return acc
  }, {})

  return {
    name: '',
    levelIds,
    type: 'Normal',
    color: '#2563eb',
    maxDailyBlocks: 2,
    cycleLoads
  }
}

function cycleLoadsToRecord(cycleLoads: SubjectCycleLoad[]): Record<string, number> {
  return cycleLoads.reduce<Record<string, number>>((acc, load) => {
    acc[load.cycleId] = load.weeklyBlocks
    return acc
  }, {})
}

export function SubjectsPage() {
  const subjects = useSchedulerDataStore((state) => state.subjects)
  const courses = useSchedulerDataStore((state) => state.courses)
  const levels = useSchedulerDataStore((state) => state.levels)
  const addSubject = useSchedulerDataStore((state) => state.addSubject)
  const updateSubject = useSchedulerDataStore((state) => state.updateSubject)
  const removeSubject = useSchedulerDataStore((state) => state.removeSubject)

  const { data: config } = useQuery(['config'], fetchConfig, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: { cycles: placeholderCycles }
  })

  const cycleOptions = config?.cycles ?? placeholderCycles
  const levelMap = useMemo(() => new Map(levels.map((level) => [level.id, level.name])), [levels])
  const derivedLevelIds = useMemo(() => {
    const ids = new Set<string>()
    courses.forEach((course) => {
      if (course.levelId) {
        ids.add(course.levelId)
      }
    })
    return Array.from(ids)
  }, [courses])

  const levelOptions = useMemo(() => {
    if (derivedLevelIds.length > 0) {
      return derivedLevelIds
        .map((id) => ({ id, name: levelMap.get(id) ?? id }))
        .filter((option) => option.name.trim().length > 0)
    }
    return FIXED_LEVELS.map((level) => ({ id: level.id, name: level.name }))
  }, [derivedLevelIds, levelMap])

  const defaultLevelSelection = useMemo(() => {
    return levelOptions.length > 0 ? [levelOptions[0].id] : [DEFAULT_LEVEL_ID]
  }, [levelOptions])

  const [draft, setDraft] = useState<SubjectDraft>(() => createEmptyDraft(cycleOptions, defaultLevelSelection))
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    setDraft((current) => {
      const nextLoads = cycleOptions.reduce<Record<string, number>>((acc, cycle) => {
        acc[cycle.id] = current.cycleLoads[cycle.id] ?? 1
        return acc
      }, {})
      const validLevels = current.levelIds.filter((levelId) => levelOptions.some((option) => option.id === levelId))
      const nextLevelIds = validLevels.length > 0 ? validLevels : defaultLevelSelection
      return { ...current, cycleLoads: nextLoads, levelIds: nextLevelIds }
    })
  }, [cycleOptions, defaultLevelSelection, levelOptions])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || draft.levelIds.length === 0) {
      return
    }

    const payload: Omit<SubjectData, 'id'> = {
      name: draft.name,
      levelIds: draft.levelIds,
      type: draft.type,
      color: draft.color,
      maxDailyBlocks: Math.max(1, Number(draft.maxDailyBlocks) || 1),
      cycleLoads: Object.entries(draft.cycleLoads).map(([cycleId, weeklyBlocks]) => ({
        cycleId,
        weeklyBlocks: Math.max(0, Number(weeklyBlocks) || 0)
      }))
    }

    if (editingId) {
      updateSubject(editingId, payload)
    } else {
      addSubject(payload)
    }

    setDraft(createEmptyDraft(cycleOptions, defaultLevelSelection))
    setEditingId(null)
  }

  const handleEdit = (subject: SubjectData) => {
    setEditingId(subject.id)
    const cycleRecord = cycleLoadsToRecord(subject.cycleLoads)
    setDraft({
      name: subject.name,
      levelIds: subject.levelIds,
      type: subject.type,
      color: subject.color,
      maxDailyBlocks: subject.maxDailyBlocks,
      cycleLoads: cycleOptions.reduce<Record<string, number>>((acc, cycle) => {
        acc[cycle.id] = cycleRecord[cycle.id] ?? 0
        return acc
      }, {})
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setDraft(createEmptyDraft(cycleOptions, defaultLevelSelection))
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
      description="Administra la oferta académica del colegio, cargas por ciclo y límites diarios antes de generar horarios."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Niveles</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Bloques por ciclo</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Máx. diarios</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Tipo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {subjects.map((subject, index) => (
                <tr key={subject.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
                      {subject.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="list-disc pl-4">
                      {subject.levelIds.map((levelId) => (
                        <li key={levelId}>{levelMap.get(levelId) ?? levelId}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="list-disc pl-4">
                      {subject.cycleLoads.map((load) => {
                        const cycleName = cycleOptions.find((cycle) => cycle.id === load.cycleId)?.name ?? load.cycleId
                        return (
                          <li key={load.cycleId}>
                            {cycleName}: {load.weeklyBlocks} bloques/semana
                          </li>
                        )
                      })}
                    </ul>
                  </td>
                  <td className="px-4 py-3">{subject.maxDailyBlocks}</td>
                  <td className="px-4 py-3">{subject.type}</td>
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
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
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
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Nombre</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Niveles asociados</span>
            <div className="grid gap-2 rounded border border-dashed border-slate-300 p-3 dark:border-slate-700">
              {levelOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.levelIds.includes(option.id)}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setDraft((current) => ({
                        ...current,
                        levelIds: checked
                          ? Array.from(new Set([...current.levelIds, option.id]))
                          : current.levelIds.filter((levelId) => levelId !== option.id)
                      }))
                    }}
                    className="h-4 w-4"
                  />
                  <span>{option.name}</span>
                </label>
              ))}
              {draft.levelIds.length === 0 && (
                <p className="text-xs text-rose-500">Selecciona al menos un nivel.</p>
              )}
            </div>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">Color</span>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
              className="h-10 w-20 cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
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
          <div className="grid gap-3 rounded border border-dashed border-slate-300 p-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Bloques semanales por ciclo</p>
            {cycleOptions.map((cycle) => (
              <label key={cycle.id} className="grid gap-1 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-300">{cycle.name}</span>
                <input
                  type="number"
                  min={0}
                  value={draft.cycleLoads[cycle.id] ?? 0}
                  onChange={(event) => {
                    const value = Math.max(0, Number(event.target.value) || 0)
                    setDraft((current) => ({
                      ...current,
                      cycleLoads: { ...current.cycleLoads, [cycle.id]: value }
                    }))
                  }}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </label>
            ))}
          </div>
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
