import httpClient from './httpClient'

export type TeacherContractType = 'full-time' | 'part-time'

export interface TeacherPayload {
  name: string
  subjectIds: number[]
  levelId: string
  courseIds: number[]
  weeklyHours: number
  contractType: TeacherContractType
}

export interface TeacherResponse extends TeacherPayload {
  id: number
}

export async function listTeachers(): Promise<TeacherResponse[]> {
  const { data } = await httpClient.get<TeacherResponse[]>('teachers')
  return data
}

export async function createTeacher(payload: TeacherPayload): Promise<TeacherResponse> {
  const { data } = await httpClient.post<TeacherResponse>('teachers', payload)
  return data
}

export async function updateTeacher(
  id: number,
  payload: TeacherPayload
): Promise<TeacherResponse> {
  const { data } = await httpClient.put<TeacherResponse>(`teachers/${id}`, payload)
  return data
}

export async function deleteTeacher(id: number): Promise<void> {
  await httpClient.delete(`teachers/${id}`)
}
