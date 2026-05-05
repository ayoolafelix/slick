import { useEffect, useState } from 'react'

export function useSolPrice() {
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        )

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          solana?: { usd?: number }
        }

        if (!cancelled && typeof payload.solana?.usd === 'number') {
          setSolPriceUsd(payload.solana.usd)
        }
      } catch {
        // Ignore quote failures and leave the UI in SOL-only mode.
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return solPriceUsd
}
