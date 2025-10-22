import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://192.168.1.154:30078/api'

export const httpClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default httpClient
