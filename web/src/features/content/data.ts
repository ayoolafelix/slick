import type { ContentRecord, NewContentInput, PurchaseRecord } from './types'
import { getSupabaseClient } from '../../lib/supabase'

function isMissingSchemaError(message: string) {
  return (
    message.includes('Could not find the table') ||
    message.includes("schema cache") ||
    message.includes('relation') ||
    message.includes('does not exist')
  )
}

function formatSupabaseError(message: string) {
  if (isMissingSchemaError(message)) {
    return 'Supabase is connected, but the monetization schema has not been applied yet. Run the migrations in /supabase/migrations first.'
  }

  return message
}

export function shouldOfferPortableMode(message: string) {
  return (
    isMissingSchemaError(message) ||
    message.includes('Supabase is not configured')
  )
}

export async function createContentRecord(
  input: NewContentInput,
): Promise<ContentRecord> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY first.',
    )
  }

  let storagePath: string | null = null
  const storageBucket = 'locked-content'

  if (input.file) {
    storagePath = `${input.creatorWallet}/${Date.now()}-${input.file.name}`
    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(storagePath, input.file)

    if (uploadError) {
      throw new Error(uploadError.message)
    }
  }

  const { data, error } = await supabase
    .from('content')
    .insert({
      creator_wallet: input.creatorWallet,
      title: input.title,
      description: input.description,
      preview_text: input.previewText,
      body_markdown: input.bodyMarkdown,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      content_hash: input.contentHash,
      chain_content_pda: input.chainContentPda,
      price_lamports: input.priceLamports,
      access_model: input.accessModel,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(formatSupabaseError(error.message))
  }

  return data
}

export async function listCreatorContent(
  creatorWallet: string,
): Promise<ContentRecord[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('creator_wallet', creatorWallet)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(formatSupabaseError(error.message))
  }

  return data ?? []
}

export async function fetchContentById(
  contentId: string,
): Promise<ContentRecord | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .maybeSingle()

  if (error) {
    throw new Error(formatSupabaseError(error.message))
  }

  return data
}

export async function lookupPurchase(
  contentId: string,
  buyerPubkey: string,
): Promise<PurchaseRecord | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('content_id', contentId)
    .eq('buyer_pubkey', buyerPubkey)
    .maybeSingle()

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return null
    }

    throw new Error(formatSupabaseError(error.message))
  }

  return data
}

export async function recordPurchase(params: {
  buyerPubkey: string
  contentId: string
  txSig: string
}) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.from('purchases').insert({
    buyer_pubkey: params.buyerPubkey,
    content_id: params.contentId,
    tx_sig: params.txSig,
  })

  if (error) {
    throw new Error(formatSupabaseError(error.message))
  }
}

export async function attachAccessPassToPurchase(params: {
  txSig: string
  mintAddress: string
  mintTxSig: string
}) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return
  }

  const { error } = await supabase
    .from('purchases')
    .update({
      access_nft_mint: params.mintAddress,
      access_nft_tx_sig: params.mintTxSig,
    })
    .eq('tx_sig', params.txSig)

  if (error && !isMissingSchemaError(error.message)) {
    throw new Error(formatSupabaseError(error.message))
  }
}

export async function listPurchasesForContentIds(
  contentIds: string[],
): Promise<PurchaseRecord[]> {
  const supabase = getSupabaseClient()
  if (!supabase || contentIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .in('content_id', contentIds)

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return []
    }

    throw new Error(formatSupabaseError(error.message))
  }

  return data ?? []
}

export async function createSignedContentUrl(storageBucket: string, storagePath: string) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(storagePath, 60 * 10)

  if (error) {
    throw new Error(formatSupabaseError(error.message))
  }

  return data.signedUrl
}
