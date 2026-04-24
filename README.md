# Slick

Week 1 starter for a programmable monetization layer on Solana.

This repo is set up around the sprint plan goals:

- `web/`: React + TypeScript frontend for creator upload, wallet connect, pay-to-unlock viewing, and shared links.
- `programs/monetization_layer/`: Anchor-compatible Solana program with `create_content` and `purchase_content`.
- `supabase/`: schema and storage policies for content metadata plus purchase confirmation records.
- `docs/`: the initial architecture decision record that turns the sprint plan into implementation choices.

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
- Supabase tables and storage bucket policies are defined.
- Anchor-compatible Solana build and local deployment scripts are in place.
- A local smoke test now verifies `create_content` and `purchase_content` against a fresh validator.
- Devnet publish is wired, but still depends on obtaining faucet funds for the dedicated deployer wallet.

## Tooling note

This workspace uses a repo-local Solana home under `/Users/felixayoola/Documents/slick/.home` because the machine-wide `~/.config` directory is not writable by the current user. Use the scripts in `/Users/felixayoola/Documents/slick/scripts` so Solana commands always resolve against the working local setup.

The local deploy script keeps the validator ledger and logs under `/Users/felixayoola/Documents/slick/.validator`. The devnet deploy script uses `/Users/felixayoola/Documents/slick/.wallets/devnet-deployer.json` as the fee payer and `/Users/felixayoola/Documents/slick/.wallets/monetization-layer-devnet.json` as the immutable program keypair.
