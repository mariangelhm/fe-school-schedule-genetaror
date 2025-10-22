import httpClient from './httpClient'

export type SubjectType = 'Normal' | 'Especial'
export type SubjectPreferredTime = 'morning' | 'afternoon' | 'any'

export interface SubjectPayload {
  name: string
  levelId: string
  weeklyBlocks: number
  maxDailyBlocks: number
  type: SubjectType
  color: string
  preferredTime: SubjectPreferredTime
}

export interface SubjectResponse extends SubjectPayload {
  id: number
}

export async function listSubjects(): Promise<SubjectResponse[]> {
  const { data } = await httpClient.get<SubjectResponse[]>('subjects')
  return data
}

export async function createSubject(payload: SubjectPayload): Promise<SubjectResponse> {
  const { data } = await httpClient.post<SubjectResponse>('subjects', payload)
  return data
}

export async function updateSubject(
  id: number,
  payload: SubjectPayload
): Promise<SubjectResponse> {
  const { data } = await httpClient.put<SubjectResponse>(`subjects/${id}`, payload)
  return data
}

export async function deleteSubject(id: number): Promise<void> {
  await httpClient.delete(`subjects/${id}`)
}
