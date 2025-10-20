// Servicio simulado para confirmar la generación. En un escenario real haría
// la llamada al backend, pero aquí devolvemos una respuesta inmediata.
export interface ScheduleSummary {
  generatedCourses: number
  assignedTeachers: number
  totalSessions: number
}

export interface GenerationPayload {
  levelId: string
  year: number
  replaceExisting: boolean
}

// Función que simula la generación y devuelve un resumen vacío.
export async function generateSchedule(_: GenerationPayload): Promise<ScheduleSummary> {
  return Promise.resolve({ generatedCourses: 0, assignedTeachers: 0, totalSessions: 0 })
}
