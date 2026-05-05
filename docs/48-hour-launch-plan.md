# 48-Hour Launch Plan

This repo was originally scoped as a 4-week sprint. With less than 48 hours, the goal is no longer to mirror the calendar. The goal is to ship the highest-yield version of the plan without lying to ourselves about what matters.

## Chosen path

- Core flow: Creator uploads content, sets a SOL price, shares a link, buyer pays, content unlocks.
- Week 2 wow feature: NFT-backed access pass.
- Week 3 edge feature: QR unlock for mobile-first demo handoff.
- Week 4 packaging: demo script, deck content, screenshots, backup plan.

## What ships in code

- Creator studio with two access models:
  - `standard`: pay once, unlock via purchase record.
  - `nft`: pay once, mint a transferable access pass after payment.
- Buyer viewer with:
  - SOL pricing and USD estimate.
  - payment confirmation and Explorer links.
  - retryable access-pass minting if payment succeeds before minting does.
  - unlock logic that respects current NFT ownership for access-pass drops.
- Portable fallback links when Supabase tables are not ready yet.
- QR creator cards on every monetized link for fast scan-to-phone demos.

## What still requires external access

- Supabase service role key or direct Postgres connection string.
  - The live Supabase project currently does not have `content` or `purchases` tables.
  - Apply:
    - [0001_initial_schema.sql](/Users/felixayoola/Documents/slick/supabase/migrations/0001_initial_schema.sql)
    - [0002_access_pass_upgrade.sql](/Users/felixayoola/Documents/slick/supabase/migrations/0002_access_pass_upgrade.sql)
- Devnet SOL for the deployer wallet if the on-chain program must be published to devnet before demo day.

## 0-12 hours

1. Apply Supabase migrations.
2. Verify local build, lint, and local Solana smoke test.
3. Run the hosted app and confirm:
   - creator content can be created
   - viewer route loads real content
   - payment confirmation appears

## 12-30 hours

1. Create one polished demo content item using NFT-backed access.
2. Mint and verify one access pass end to end.
3. Test QR handoff:
   - laptop creator flow
   - phone scan
   - mobile wallet connection
   - unlock on phone

## 30-48 hours

1. Capture screenshots from the live app for the deck.
2. Rehearse the 60-second demo three times.
3. Record a backup screen capture of the full flow.
4. Finalize the pitch narrative and slide deck.

## Non-negotiables

- One hero flow only.
- One wow moment only.
- Explorer links ready in every payment demo.
- Backup recording ready before the live pitch.
