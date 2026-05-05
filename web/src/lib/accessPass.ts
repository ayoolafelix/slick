import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey } from '@solana/web3.js'
import type { ContentRecord } from '../features/content/types'

export type OwnedAccessPass = {
  mintAddress: string
  metadataUri: string
  name: string
  symbol: string
}

function buildMetaplex(connection: Connection, wallet?: WalletContextState) {
  const metaplex = Metaplex.make(connection)

  if (wallet?.publicKey && wallet.signTransaction) {
    metaplex.use(walletAdapterIdentity(wallet))
  }

  return metaplex
}

function truncate(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, Math.max(0, limit - 1))}`
}

export function buildAccessPassMetadataUri(content: ContentRecord) {
  const publicOrigin =
    import.meta.env.VITE_PUBLIC_APP_URL ||
    (typeof window !== 'undefined'
      ? /localhost|127\.0\.0\.1/.test(window.location.hostname)
        ? 'https://slick-web-lemon.vercel.app'
        : window.location.origin
      : 'https://slick-web-lemon.vercel.app')
  const baseUrl = `${publicOrigin}/access-pass/metadata.json`

  const params = new URLSearchParams({
    contentId: content.id,
    creator: content.creator_wallet,
    title: content.title,
    priceLamports: String(content.price_lamports),
  })

  return `${baseUrl}?${params.toString()}`
}

function isAccessPassForContent(uri: string, contentId: string) {
  try {
    const parsed = new URL(uri)
    return (
      parsed.pathname.endsWith('/access-pass/metadata.json') &&
      parsed.searchParams.get('contentId') === contentId
    )
  } catch {
    return uri.includes('/access-pass/metadata.json') && uri.includes(`contentId=${contentId}`)
  }
}

export async function mintAccessPass(params: {
  connection: Connection
  wallet: WalletContextState
  content: ContentRecord
}) {
  if (!params.wallet.publicKey || !params.wallet.signTransaction) {
    throw new Error('Connect a wallet that can sign before minting an access pass.')
  }

  const metaplex = buildMetaplex(params.connection, params.wallet)
  const symbol = 'SLICKPASS'
  const name = truncate(`Slick Pass ${params.content.id.slice(0, 6)}`, 32)

  const { nft, response } = await metaplex.nfts().create({
    name,
    symbol,
    uri: buildAccessPassMetadataUri(params.content),
    sellerFeeBasisPoints: 0,
    tokenOwner: params.wallet.publicKey,
    isMutable: false,
  })

  return {
    mintAddress: nft.address.toBase58(),
    metadataUri: nft.uri,
    name: nft.name,
    symbol: nft.symbol,
    txSig: response.signature,
  }
}

export async function findOwnedAccessPass(params: {
  connection: Connection
  owner: PublicKey
  contentId: string
}) {
  const metaplex = buildMetaplex(params.connection)
  const assets = await metaplex.nfts().findAllByOwner({ owner: params.owner })

  const match = assets.find(
    (asset) => asset.symbol === 'SLICKPASS' && isAccessPassForContent(asset.uri, params.contentId),
  )

  if (!match) {
    return null
  }

  const mintAddress = 'mintAddress' in match ? match.mintAddress : match.address

  return {
    mintAddress: mintAddress.toBase58(),
    metadataUri: match.uri,
    name: match.name,
    symbol: match.symbol,
  } satisfies OwnedAccessPass
}
