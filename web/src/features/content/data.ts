import type { ContentRecord, NewContentInput, PurchaseRecord } from './types'
import { getSupabaseClient } from '../../lib/supabase'

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
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
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
    throw new Error(error.message)
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
    throw new Error(error.message)
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
    throw new Error(error.message)
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
    throw new Error(error.message)
  }
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
    throw new Error(error.message)
  }

  return data.signedUrl
}
