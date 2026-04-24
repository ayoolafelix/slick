#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/solana-env.sh"

PROGRAM_SO="$ROOT_DIR/target/deploy/monetization_layer.so"
RPC_URL="${SOLANA_RPC_URL:-https://api.devnet.solana.com}"

if [[ ! -f "$DEPLOYER_WALLET" ]]; then
  solana-keygen new --silent --no-bip39-passphrase -o "$DEPLOYER_WALLET"
fi

DEPLOYER_BALANCE_LAMPORTS="$(
  solana balance --lamports "$DEPLOYER_WALLET" --url "$RPC_URL" | awk '{print $1}'
)"
if [[ "${DEPLOYER_BALANCE_LAMPORTS:-0}" -lt 2000000000 ]]; then
  solana airdrop 2 "$DEPLOYER_WALLET" --url "$RPC_URL" \
    || solana airdrop 1 "$DEPLOYER_WALLET" --url "$RPC_URL" \
    || true
fi

cargo build-sbf \
  --manifest-path "$ROOT_DIR/programs/monetization_layer/Cargo.toml" \
  --sbf-out-dir "$ROOT_DIR/target/deploy"

solana program deploy \
  --url "$RPC_URL" \
  --keypair "$DEPLOYER_WALLET" \
  --program-id "$PROGRAM_KEYPAIR" \
  "$PROGRAM_SO"
