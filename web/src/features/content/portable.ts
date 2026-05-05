import type { ContentRecord, NewContentInput, PurchaseRecord } from './types'

type PortableShare = {
  record: ContentRecord
  shareUrl: string
}

const portableShareStorageKey = 'slick-portable-shares-v1'
const localPurchaseStorageKey = 'slick-local-purchases-v1'
const maxPortablePayloadLength = 3_200

function hasWindow() {
  return typeof window !== 'undefined'
}

function sortRecordsByDate(records: ContentRecord[]) {
  return [...records].sort((left, right) => right.created_at.localeCompare(left.created_at))
}

function readStoredJson<T>(key: string): T[] {
  if (!hasWindow()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeStoredJson<T>(key: string, value: T[]) {
  if (!hasWindow()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function encodeBase64Url(value: string) {
  if (!hasWindow()) {
    return ''
  }

  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  if (!hasWindow()) {
    return ''
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = window.atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function isContentRecord(value: unknown): value is ContentRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.creator_wallet === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.content_hash === 'string' &&
    typeof candidate.price_lamports === 'number' &&
    typeof candidate.created_at === 'string' &&
    (candidate.access_model === 'standard' || candidate.access_model === 'nft')
  )
}

export function buildPortableContentRecord(
  input: Omit<NewContentInput, 'file'>,
): ContentRecord {
  return {
    id: `portable-${crypto.randomUUID()}`,
    creator_wallet: input.creatorWallet,
    title: input.title,
    description: input.description || null,
    preview_text: input.previewText || null,
    body_markdown: input.bodyMarkdown || null,
    storage_bucket: null,
    storage_path: null,
    content_hash: input.contentHash,
    chain_content_pda: input.chainContentPda,
    price_lamports: input.priceLamports,
    access_model: input.accessModel,
    created_at: new Date().toISOString(),
  }
}

export function encodePortableContent(record: ContentRecord) {
  return encodeBase64Url(JSON.stringify(record))
}

export function decodePortableContent(payload: string) {
  try {
    const parsed = JSON.parse(decodeBase64Url(payload))
    return isContentRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function buildPortableShareUrl(record: ContentRecord, origin = window.location.origin) {
  const payload = encodePortableContent(record)

  if (payload.length > maxPortablePayloadLength) {
    throw new Error(
      'Portable demo links work best for short text-only drops. Shorten the preview or unlocked body, or finish the Supabase setup before sharing this item.',
    )
  }

  const url = new URL(`/view/${record.id}`, origin)
  url.searchParams.set('payload', payload)
  return url.toString()
}

export function savePortableShare(share: PortableShare) {
  const current = readStoredJson<PortableShare>(portableShareStorageKey)
  const next = [
    share,
    ...current.filter((entry) => entry.record.id !== share.record.id),
  ]

  writeStoredJson(portableShareStorageKey, next)
}

export function listPortableShares(creatorWallet?: string) {
  const shares = readStoredJson<PortableShare>(portableShareStorageKey)
  const filtered = creatorWallet
    ? shares.filter((share) => share.record.creator_wallet === creatorWallet)
    : shares

  return filtered.sort((left, right) =>
    right.record.created_at.localeCompare(left.record.created_at),
  )
}

function upsertLocalPurchase(purchase: PurchaseRecord) {
  const current = readStoredJson<PurchaseRecord>(localPurchaseStorageKey)
  const next = [
    purchase,
    ...current.filter(
      (entry) =>
        !(
          entry.content_id === purchase.content_id &&
          entry.buyer_pubkey === purchase.buyer_pubkey
        ),
    ),
  ]

  writeStoredJson(localPurchaseStorageKey, next)
}

export function rememberLocalPurchase(params: {
  buyerPubkey: string
  contentId: string
  txSig: string
}) {
  upsertLocalPurchase({
    id: `local-${params.contentId}-${params.buyerPubkey}`,
    buyer_pubkey: params.buyerPubkey,
    content_id: params.contentId,
    tx_sig: params.txSig,
    access_nft_mint: null,
    access_nft_tx_sig: null,
    confirmed_at: new Date().toISOString(),
  })
}

export function lookupLocalPurchase(contentId: string, buyerPubkey: string) {
  const purchases = readStoredJson<PurchaseRecord>(localPurchaseStorageKey)

  return (
    purchases.find(
      (purchase) =>
        purchase.content_id === contentId && purchase.buyer_pubkey === buyerPubkey,
    ) ?? null
  )
}

export function attachAccessPassToLocalPurchase(params: {
  contentId: string
  buyerPubkey: string
  mintAddress: string
  mintTxSig: string
}) {
  const existing = lookupLocalPurchase(params.contentId, params.buyerPubkey)
  if (!existing) {
    return
  }

  upsertLocalPurchase({
    ...existing,
    access_nft_mint: params.mintAddress,
    access_nft_tx_sig: params.mintTxSig,
  })
}

export function listLocalPurchasesForContentIds(contentIds: string[]) {
  if (contentIds.length === 0) {
    return []
  }

  const requestedIds = new Set(contentIds)
  return readStoredJson<PurchaseRecord>(localPurchaseStorageKey).filter((purchase) =>
    requestedIds.has(purchase.content_id),
  )
}

export function mergeContentRecords(...groups: ContentRecord[][]) {
  const byId = new Map<string, ContentRecord>()

  groups.flat().forEach((record) => {
    byId.set(record.id, record)
  })

  return sortRecordsByDate([...byId.values()])
}
