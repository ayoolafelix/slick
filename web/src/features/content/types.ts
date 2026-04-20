export type ContentRecord = {
  id: string
  creator_wallet: string
  title: string
  description: string | null
  preview_text: string | null
  body_markdown: string | null
  storage_bucket: string | null
  storage_path: string | null
  content_hash: string
  chain_content_pda: string | null
  price_lamports: number
  created_at: string
}

export type PurchaseRecord = {
  id: string
  buyer_pubkey: string
  content_id: string
  tx_sig: string
  confirmed_at: string
}

export type NewContentInput = {
  creatorWallet: string
  title: string
  description: string
  previewText: string
  bodyMarkdown: string
  priceLamports: number
  contentHash: string
  chainContentPda: string | null
  file: File | null
}
