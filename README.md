# Slick

Compressed MVP for a programmable monetization layer on Solana.

This repo is set up around the sprint plan goals:

- `web/`: React + TypeScript frontend for creator upload, wallet connect, pay-to-unlock viewing, and shared links.
- `programs/monetization_layer/`: Anchor-compatible Solana program with `create_content` and `purchase_content`.
- `supabase/`: schema and storage policies for content metadata plus purchase confirmation records.
- `docs/`: the architecture decision record plus demo and pitch assets for the 48-hour version.

## Quick start

1. Install frontend dependencies:

```bash
cd /Users/felixayoola/Documents/slick/web
npm install
```

2. Create a frontend env file:

```bash
cp .env.example .env
```

3. Run the app:

```bash
npm run dev
```

4. Apply the Supabase SQL migration in your project.

5. Copy the frontend env file and fill in Supabase:

```bash
cd /Users/felixayoola/Documents/slick/web
cp .env.example .env
```

Set `VITE_SUPABASE_URL` and then use either `VITE_SUPABASE_ANON_KEY` or
`VITE_SUPABASE_PUBLISHABLE_KEY` for the client-side Supabase key. Set
`VITE_PUBLIC_APP_URL` if you want access-pass metadata to keep pointing at a
public host even when you mint from localhost.

6. Deploy the Solana program locally with the repo-local toolchain home:

```bash
cd /Users/felixayoola/Documents/slick
bash scripts/local-deploy.sh
```

7. Smoke test the local on-chain flow end to end:

```bash
cd /Users/felixayoola/Documents/slick
bash scripts/smoke-test-local.sh
```

8. When the public devnet faucet is available again, deploy to devnet with the dedicated payer wallet:

```bash
cd /Users/felixayoola/Documents/slick
bash scripts/devnet-deploy.sh
```

## Current status

- Frontend routes and UX for creator and consumer flows are in place.
- Creator links can now be configured as direct unlocks or NFT-backed access-pass drops.
- If Supabase tables are still missing, the creator flow can fall back to a portable text-only link that packages the content directly into the share URL.
- QR-based mobile handoff is built into the creator flow for live demos.
- Supabase tables and storage bucket policies are defined.
- A follow-up migration now adds access-model fields for the NFT-backed path.
- Anchor-compatible Solana build and local deployment scripts are in place.
- A local smoke test now verifies `create_content` and `purchase_content` against a fresh validator.
- Devnet publish is wired, but still depends on obtaining faucet funds for the dedicated deployer wallet.
- The public Supabase project still needs the migrations applied before the hosted flow can create real content.

## 48-hour assets

- [48-hour launch plan](/Users/felixayoola/Documents/slick/docs/48-hour-launch-plan.md)
- [Demo script](/Users/felixayoola/Documents/slick/docs/demo-script.md)
- [Pitch narrative](/Users/felixayoola/Documents/slick/docs/pitch-narrative.md)
- [Pitch deck content](/Users/felixayoola/Documents/slick/docs/pitch-deck.md)
- [Pitch deck PPTX](/Users/felixayoola/Documents/slick/docs/slick-pitch-deck.pptx)
- [Demo video shot list](/Users/felixayoola/Documents/slick/docs/demo-video-shotlist.md)
- [Demo checklist](/Users/felixayoola/Documents/slick/docs/demo-checklist.md)

## Tooling note

This workspace uses a repo-local Solana home under `/Users/felixayoola/Documents/slick/.home` because the machine-wide `~/.config` directory is not writable by the current user. Use the scripts in `/Users/felixayoola/Documents/slick/scripts` so Solana commands always resolve against the working local setup.

The local deploy script keeps the validator ledger and logs under `/Users/felixayoola/Documents/slick/.validator`. The devnet deploy script uses `/Users/felixayoola/Documents/slick/.wallets/devnet-deployer.json` as the fee payer and `/Users/felixayoola/Documents/slick/.wallets/monetization-layer-devnet.json` as the immutable program keypair.
