// Cliente encargado de generar la tarea de creación de horarios a través del backend.
import httpClient from './httpClient'

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

// Función que envía la solicitud de generación al servicio remoto y retorna el resumen.
export async function generateSchedule(payload: GenerationPayload): Promise<ScheduleSummary> {
  const { data } = await httpClient.post<ScheduleSummary>('tasks', payload)
  return data
}
