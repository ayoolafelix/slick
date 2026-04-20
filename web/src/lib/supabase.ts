import { createClient } from '@supabase/supabase-js'
import { runtimeConfig } from './config'
import type { Database } from './database.types'

let client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!runtimeConfig.supabaseConfigured) {
    return null
  }

  if (!client) {
    client = createClient<Database>(
      runtimeConfig.supabaseUrl,
      runtimeConfig.supabaseAnonKey,
    )
  }

  return client
}
