import { FormEvent, useState } from 'react'
import { MaintenanceLayout } from '../../components/MaintenanceLayout'

interface Course {
  id: number
  name: string
  level: string
  headTeacher: string
  students: number
}

const initialCourses: Course[] = [
  { id: 1, name: '1° Básico A', level: '1° Básico', headTeacher: 'María López', students: 32 },
  { id: 2, name: '2° Básico B', level: '2° Básico', headTeacher: 'Carlos Rivas', students: 29 }
]

const emptyCourse: Course = {
  id: 0,
  name: '',
  level: '',
  headTeacher: '',
  students: 30
}

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [draft, setDraft] = useState<Course>({ ...emptyCourse })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.level.trim() || !draft.headTeacher.trim()) {
      return
    }

    const newCourse: Course = {
      ...draft,
      id: Date.now()
    }

    setCourses((current) => [newCourse, ...current])
    setDraft({ ...emptyCourse })
  }

  const handleDelete = (id: number) => {
    setCourses((current) => current.filter((course) => course.id !== id))
  }

  return (
    <MaintenanceLayout
      title="Cursos"
      description="Mantén actualizada la nómina de cursos, su nivel y profesor jefe para distribuir cargas correctamente."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Curso</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Nivel</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Profesor jefe</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Alumnos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {courses.map((course) => (
                <tr key={course.id} className="bg-white text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <td className="px-4 py-3 font-medium">{course.name}</td>
                  <td className="px-4 py-3">{course.level}</td>
                  <td className="px-4 py-3">{course.headTeacher}</td>
                  <td className="px-4 py-3">{course.students}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm text-rose-500 hover:text-rose-600"
                      type="button"
                      onClick={() => handleDelete(course.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay cursos registrados.
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
          <h2 className="text-lg font-semibold">Nuevo curso</h2>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">Profesor jefe</span>
            <input
              value={draft.headTeacher}
              onChange={(event) => setDraft((current) => ({ ...current, headTeacher: event.target.value }))}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Cantidad de alumnos</span>
            <input
              type="number"
              min={1}
              value={draft.students}
              onChange={(event) =>
                setDraft((current) => ({ ...current, students: Math.max(1, Number(event.target.value) || 1) }))
              }
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-brand focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <button type="submit" className="rounded bg-brand-dynamic px-4 py-2 text-sm font-semibold text-white">
            Guardar curso
          </button>
        </form>
      </div>
    </MaintenanceLayout>
  )
}
