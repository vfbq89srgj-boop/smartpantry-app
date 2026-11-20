/*
  Supabase client – handles login, the session and refreshing the token.
  Same setup as Stefan's test page (smartpantry-frontend/src/supabase.ts).
*/
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** false = no Supabase values in .env → the app runs in demo mode without login */
export const authConfigured = Boolean(url && key)

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')
