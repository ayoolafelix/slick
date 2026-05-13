import type { ContentRecord } from './types'

export const featuredContentId = 'featured-access-pass'
export const featuredViewerPath = `/view/${featuredContentId}`

export const featuredContent: ContentRecord = {
  id: featuredContentId,
  creator_wallet: 'nX9g6QgDB6pxBJDCCq6ZC7qSiMdad8ZEZJDEyjKjc8h',
  title: 'Creator Revenue Brief: Portable Access Playbook',
  description:
    'A premium release on direct distribution, wallet-native checkout, and collectible access for modern creators.',
  preview_text:
    'Independent creators need monetization that keeps margin, brand, and audience control in the same place. This brief outlines how direct wallet checkout changes the economics of paid digital access.',
  body_markdown:
    'Portable monetization starts with one simple promise: the moment value is paid, access becomes programmable. A creator can price a release, distribute a clean link, and settle instantly on Solana. From there the unlock can stay simple or become transferable through an access pass that moves with the holder. That turns paid content from a one-time checkout into a reusable layer for memberships, files, communities, and premium research.',
  storage_bucket: null,
  storage_path: null,
  content_hash: 'featured-access-pass-content-hash',
  chain_content_pda: null,
  price_lamports: 150_000_000,
  access_model: 'nft',
  created_at: '2026-05-12T00:00:00.000Z',
}
