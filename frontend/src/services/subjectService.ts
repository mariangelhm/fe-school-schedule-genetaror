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
  id: string
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
  _id?: string
  id?: string | number
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
  const identifier =
    (response._id && `${response._id}`.trim()) ||
    (typeof response.id === 'number' || typeof response.id === 'string' ? `${response.id}` : '') ||
    `${Date.now()}`
  return {
    id: identifier,
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
  id: string,
  payload: SubjectPayload
): Promise<SubjectResponse> {
  const { data } = await httpClient.put<SubjectApiResponse>(
    `subjects/${encodeURIComponent(id)}`,
    mapToApiPayload(payload)
  )
  return mapFromApiResponse(data)
}

export async function deleteSubject(id: string): Promise<void> {
  await httpClient.delete(`subjects/${encodeURIComponent(id)}`)
}
