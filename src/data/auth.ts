/*
  Login state for the whole app.
  The account itself lives in Supabase (Stefan created the test accounts there).
*/
import { computed, ref } from 'vue'
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

/**
  First name for greetings ("Hi, Alex!").
  Comes from the Supabase user's metadata (Dashboard → Authentication → Users → edit "user_metadata",
  e.g. {"first_name": "Alex"}, or set at sign-up via options.data). Without a name: the part
  of the email before the "@", capitalised. Null when nobody is signed in.
*/
export const displayName = computed(() => {
  const user = session.value?.user
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const full: unknown = meta.first_name ?? meta.name ?? meta.full_name ?? meta.display_name
  if (typeof full === 'string' && full.trim()) return full.trim().split(/\s+/)[0]
  const local = user.email?.split('@')[0]
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : null
})

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? error.message : null
}

export async function signOut() {
  await supabase.auth.signOut()
}
