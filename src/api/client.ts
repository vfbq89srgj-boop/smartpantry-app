/*
  Small helper for calls to Benny's API.
  It adds the login token ("Authorization: Bearer …") to every request.
*/
import { supabase } from '../lib/supabase'

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** true = we talk to the real backend, false = demo mode with sample data */
export const apiConfigured = Boolean(API_URL)

/** Current access token, or undefined when not logged in */
export async function getToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = await getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${API_URL}${path}`, { ...init, headers })
}
