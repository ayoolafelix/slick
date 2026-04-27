import { clusterApiUrl } from '@solana/web3.js'

type Network = 'devnet' | 'mainnet-beta' | 'testnet'

const solanaNetwork = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as Network
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
const programId = import.meta.env.VITE_MONETIZATION_PROGRAM_ID || ''

export const runtimeConfig = {
  solanaNetwork,
  rpcEndpoint: clusterApiUrl(solanaNetwork),
  supabaseUrl,
  supabaseAnonKey,
  programId,
  supabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  programConfigured:
    Boolean(programId) && programId !== '11111111111111111111111111111111',
}

export const hasAppConfig =
  runtimeConfig.supabaseConfigured && runtimeConfig.programConfigured
