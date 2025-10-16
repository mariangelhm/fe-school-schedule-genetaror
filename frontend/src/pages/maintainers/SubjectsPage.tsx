import { FormEvent, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'

type SubjectType = 'Normal' | 'Especial'

interface Subject {
  id: number
  name: string
  level: string
  weeklyBlocks: number
  type: SubjectType
  color: string
}

const initialSubjects: Subject[] = [
  { id: 1, name: 'Lenguaje', level: '1° Básico', weeklyBlocks: 6, type: 'Normal', color: '#2563eb' },
  { id: 2, name: 'Matemática', level: '1° Básico', weeklyBlocks: 5, type: 'Normal', color: '#9333ea' },
  { id: 3, name: 'Música', level: 'General', weeklyBlocks: 2, type: 'Especial', color: '#eab308' }
]

const emptySubject: Subject = {
  id: 0,
  name: '',
  level: '',
  weeklyBlocks: 4,
  type: 'Normal',
  color: '#2563eb'
}

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [draft, setDraft] = useState<Subject>({ ...emptySubject })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.level.trim()) {
      return
    }

    const newSubject: Subject = {
      ...draft,
      id: Date.now()
    }

    setSubjects((current) => [newSubject, ...current])
    setDraft({ ...emptySubject })
  }

  const handleDelete = (id: number) => {
    setSubjects((current) => current.filter((subject) => subject.id !== id))
  }

  return (
    <MaintenanceLayout
      title="Asignaturas"
      description="Administra la oferta académica del colegio y sus características para la generación de horarios."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Bloques</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Tipo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {subjects.map((subject) => (
                <tr key={subject.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
                      {subject.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">{subject.level}</td>
                  <td className="px-4 py-3">{subject.weeklyBlocks}</td>
                  <td className="px-4 py-3">{subject.type}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm text-rose-500 hover:text-rose-600"
                      type="button"
                      onClick={() => handleDelete(subject.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
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
          <h2 className="text-lg font-semibold">Nueva asignatura</h2>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">Nivel</span>
            <input
              value={draft.level}
              onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
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
          <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
            Guardar asignatura
          </button>
        </form>
      </div>
    </MaintenanceLayout>
  )
}
