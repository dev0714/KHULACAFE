import { createClient } from '@supabase/supabase-js'

// Never import this file in client components — it uses the service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
