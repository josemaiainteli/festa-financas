import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se as variaveis de ambiente nao estiverem configuradas, o app roda em
// modo LOCAL (localStorage). Assim ele funciona na hora, sem backend.
export const isCloud = Boolean(url && key)

export const supabase = isCloud ? createClient(url, key) : null
