import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mhvjnpfpovfyqfoajctp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sO58Xj_DkUUcW3WRPaJWQQ_hExLcUrM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
