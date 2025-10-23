import httpClient from './httpClient'

export type SubjectType = 'Normal' | 'Especial' | (string & {})
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

interface SubjectApiPayload {
  name: string
  level: string
  weeklyBlocks: number
  type: SubjectType
  color: string
  maxDailyBlocks: number
  preferredTime: SubjectPreferredTime
}

interface SubjectApiResponse extends SubjectApiPayload {
  id: number
}

function mapToApiPayload(payload: SubjectPayload): SubjectApiPayload {
  return {
    name: payload.name,
    level: payload.levelId,
    weeklyBlocks: payload.weeklyBlocks,
    type: payload.type,
    color: payload.color,
    maxDailyBlocks: payload.maxDailyBlocks,
    preferredTime: payload.preferredTime
  }
}

function mapFromApiResponse(response: SubjectApiResponse): SubjectResponse {
  return {
    id: Number(response.id),
    name: response.name,
    levelId: response.level,
    weeklyBlocks: response.weeklyBlocks,
    maxDailyBlocks: response.maxDailyBlocks,
    type: response.type,
    color: response.color,
    preferredTime: response.preferredTime
  }
}

export async function listSubjects(): Promise<SubjectResponse[]> {
  const { data } = await httpClient.get<SubjectApiResponse[]>('subjects')
  return data.map(mapFromApiResponse)
}

export async function createSubject(payload: SubjectPayload): Promise<SubjectResponse> {
  const { data } = await httpClient.post<SubjectApiResponse>('subjects', mapToApiPayload(payload))
  return mapFromApiResponse(data)
}

export async function updateSubject(
  name: string,
  payload: SubjectPayload
): Promise<SubjectResponse> {
  const { data } = await httpClient.put<SubjectApiResponse>(
    `subjects/${encodeURIComponent(name)}`,
    mapToApiPayload(payload)
  )
  return mapFromApiResponse(data)
}

export async function deleteSubject(name: string): Promise<void> {
  await httpClient.delete(`subjects/${encodeURIComponent(name)}`)
}
