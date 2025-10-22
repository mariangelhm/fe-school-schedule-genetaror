import httpClient from './httpClient'

export interface CoursePayload {
  name: string
  levelId: string
  headTeacherId: number | null
  classroomId: number | null
  studentCount?: number
}

export interface CourseResponse extends CoursePayload {
  id: number
}

export async function listCourses(): Promise<CourseResponse[]> {
  const { data } = await httpClient.get<CourseResponse[]>('courses')
  return data
}

export async function createCourse(payload: CoursePayload): Promise<CourseResponse> {
  const { data } = await httpClient.post<CourseResponse>('courses', payload)
  return data
}

export async function updateCourse(
  id: number,
  payload: CoursePayload
): Promise<CourseResponse> {
  const { data } = await httpClient.put<CourseResponse>(`courses/${id}`, payload)
  return data
}

export async function deleteCourse(id: number): Promise<void> {
  await httpClient.delete(`courses/${id}`)
}
