import axios, { isAxiosError } from 'axios'
import { env } from '@/lib/env'

export const http = axios.create({
  baseURL: `${env.apiBaseUrl}/api`,
  timeout: 30_000,
})

/** 后端错误统一是 `{ error: string }`。 */
export function getApiErrorMessage(error: unknown): string | null {
  if (isAxiosError<{ error?: string }>(error)) return error.response?.data?.error ?? error.message
  return error instanceof Error ? error.message : null
}
