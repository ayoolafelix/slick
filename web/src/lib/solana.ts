import { PublicKey } from '@solana/web3.js'
import { runtimeConfig } from './config'

const LAMPORTS_PER_SOL = 1_000_000_000

export function toLamports(priceInSol: string) {
  return Math.round(Number(priceInSol || '0') * LAMPORTS_PER_SOL)
}

export function formatSol(lamports: number) {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(3)} SOL`
}

export function shortenAddress(address: string) {
  if (address.length < 10) {
    return address
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function deriveContentPda(creatorWallet: string) {
  const creator = new PublicKey(creatorWallet)
  const programId = new PublicKey(runtimeConfig.programId)
  const [contentPda] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('content'), creator.toBytes()],
    programId,
  )

  return contentPda.toBase58()
}

export async function digestContent(input: string | ArrayBuffer) {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  const buffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 64)
}
