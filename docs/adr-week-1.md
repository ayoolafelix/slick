# Architecture Decision Record

## Scope

Week 1 is intentionally narrow: one creator uploads content, sets a price in SOL, shares a link, and one consumer pays to unlock it. Everything in this repo optimizes for that path.

## Component map

```text
Creator Browser
  -> React frontend
  -> Supabase storage (private file upload)
  -> Supabase Postgres (content metadata)
  -> Solana Anchor program (price + content hash on-chain)

Consumer Browser
  -> React frontend
  -> Supabase Postgres (content metadata + purchase lookup)
  -> Solana Anchor program (purchase transaction)
  -> Supabase Postgres (purchase confirmation row)
  -> Supabase storage (signed file access) or inline text unlock
```

## Creator flow

1. Creator connects a Solana wallet in the React app.
2. Creator enters title, description, preview copy, body text or uploads a file, and sets a price in SOL.
3. Frontend converts SOL to lamports and computes a content hash.
4. If a file is present, the app uploads it into a private Supabase storage bucket.
5. Frontend derives the content PDA and calls `create_content` on-chain once the deployed program ID is configured.
6. Frontend stores a `content` row in Supabase with the shareable UUID, creator wallet, content hash, price, and PDA.
7. The app returns a shareable `/view/:contentId` URL.

## Consumer flow

1. Consumer opens `/view/:contentId`.
2. Frontend loads metadata from Supabase and checks whether a purchase row already exists for the connected wallet.
3. If the wallet has not purchased yet, the app displays a lock screen with price and preview content.
4. Consumer clicks pay, which triggers `purchase_content` against the Anchor program.
5. The program transfers SOL directly from buyer to creator and emits a purchase event.
6. Frontend records the confirmed transaction signature in the `purchases` table.
7. The UI unlocks text content immediately or generates a signed storage URL for private file access.

## On-chain design

### Content account

- PDA seed: `[b"content", creator.key()]`
- Fields:
  - `creator: Pubkey`
  - `price_lamports: u64`
  - `content_hash: String`
  - `created_at: i64`
  - `bump: u8`

### Instructions

- `create_content(price_lamports: u64, content_hash: String)`
  - Initializes the creator's content PDA.
  - Stores creator wallet, price, content hash, timestamp, and bump.
- `purchase_content()`
  - Validates that the passed creator matches the content account.
  - Transfers `price_lamports` from buyer to creator via the system program.
  - Emits a purchase event for off-chain reconciliation.

## Off-chain data

On-chain stores only what is needed to prove pricing and payment destination. Everything mutable or bulky stays off-chain:

- Content title, description, preview text, unlocked body text
- File storage path
- Shareable UUID
- Purchase rows for instant UX lookup

This keeps the contract small and keeps Week 1 aligned with the sprint plan's "do not overbuild the contract" rule.

## Supabase schema

### `content`

- `id uuid primary key`
- `creator_wallet text not null`
- `title text not null`
- `description text`
- `preview_text text`
- `body_markdown text`
- `storage_bucket text`
- `storage_path text`
- `content_hash text not null`
- `chain_content_pda text`
- `price_lamports bigint not null`
- `created_at timestamptz not null`

### `purchases`

- `id uuid primary key`
- `content_id uuid references content(id)`
- `buyer_pubkey text not null`
- `tx_sig text not null unique`
- `confirmed_at timestamptz not null`
- `created_at timestamptz not null`
- unique on `(content_id, buyer_pubkey)`

## Top technical risks

1. Purchase confirmation drift between Solana and Supabase.
   Mitigation: record the transaction signature from the wallet response, confirm it at `confirmed` commitment, and show the Explorer link in the UI.

2. Private content leaking through storage misconfiguration.
   Mitigation: use a private Supabase bucket, signed URLs after purchase, and keep inline preview text separate from unlocked content.

3. Program deployment/config mismatch between frontend and devnet.
   Mitigation: centralize the program ID in env config, surface missing config clearly in the app, and keep the PDA scheme simple for the first sprint.
