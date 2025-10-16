import axios from 'axios'

export interface ConfigResponse {
  schoolName?: string
  primaryColor?: string
  blockDuration?: number
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const { data } = await axios.get<ConfigResponse>('config')
  return data
}

export async function updateConfig(payload: {
  schoolName: string
  primaryColor: string
  blockDuration: number
}): Promise<ConfigResponse> {
  const { data } = await axios.put<ConfigResponse>('config', payload)
  return data
}
