/*
  Login state for the whole app.
  The account itself lives in Supabase (Stefan created the test accounts there).
*/
import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { authConfigured, supabase } from '../lib/supabase'

export const session = ref<Session | null>(null)
export const authReady = ref(!authConfigured) // in demo mode there is nothing to wait for

/** Called once when the app starts */
export async function initAuth() {
  if (!authConfigured) return
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  // Keeps `session` up to date on login, logout and automatic token refresh
  supabase.auth.onAuthStateChange((_event, s) => (session.value = s))
  authReady.value = true
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? error.message : null
}

export async function signOut() {
  await supabase.auth.signOut()
}
