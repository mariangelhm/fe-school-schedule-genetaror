import httpClient from './httpClient'

export interface ClassroomPayload {
  name: string
  levelId: string
}

export interface ClassroomResponse extends ClassroomPayload {
  id: number
}

export async function listClassrooms(): Promise<ClassroomResponse[]> {
  const { data } = await httpClient.get<ClassroomResponse[]>('classrooms')
  return data
}

export async function createClassroom(
  payload: ClassroomPayload
): Promise<ClassroomResponse> {
  const { data } = await httpClient.post<ClassroomResponse>('classrooms', payload)
  return data
}

export async function updateClassroom(
  id: number,
  payload: ClassroomPayload
): Promise<ClassroomResponse> {
  const { data } = await httpClient.put<ClassroomResponse>(`classrooms/${id}`, payload)
  return data
}

export async function deleteClassroom(id: number): Promise<void> {
  await httpClient.delete(`classrooms/${id}`)
}
