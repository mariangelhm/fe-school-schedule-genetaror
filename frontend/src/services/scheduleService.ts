import axios from 'axios'

export interface ScheduleSummary {
  generatedCourses: number
  assignedTeachers: number
  totalSessions: number
}

export interface GenerationPayload {
  mode: 'full' | 'course'
  year: number
  replaceExisting: boolean
  courseId?: number
}

export async function fetchScheduleSummary(): Promise<ScheduleSummary> {
  const { data } = await axios.get<ScheduleSummary>('schedule/summary')
  return data
}

export async function generateSchedule(payload: GenerationPayload): Promise<ScheduleSummary> {
  const { data } = await axios.post<ScheduleSummary>('schedule/generate', payload)
  return data
}

export async function exportSchedule(format: string): Promise<{ downloadUrl: string; format: string }> {
  const { data } = await axios.post<{ downloadUrl: string; format: string }>(`schedule/export?format=${format}`)
  return data
}
