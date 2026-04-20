#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/solana-env.sh"

PROGRAM_SO="$ROOT_DIR/target/deploy/monetization_layer.so"

if [[ ! -f "$DEPLOYER_WALLET" ]]; then
  solana-keygen new --silent --no-bip39-passphrase -o "$DEPLOYER_WALLET"
fi

solana config set --url devnet --keypair "$DEPLOYER_WALLET"

DEPLOYER_BALANCE_LAMPORTS="$(solana balance --lamports "$DEPLOYER_WALLET" | awk '{print $1}')"
if [[ "${DEPLOYER_BALANCE_LAMPORTS:-0}" -lt 2000000000 ]]; then
  solana airdrop 2 "$DEPLOYER_WALLET" || solana airdrop 1 "$DEPLOYER_WALLET" || true
fi

cargo build-sbf \
  --manifest-path "$ROOT_DIR/programs/monetization_layer/Cargo.toml" \
  --sbf-out-dir "$ROOT_DIR/target/deploy"

solana program deploy \
  --program-id "$PROGRAM_KEYPAIR" \
  "$PROGRAM_SO"
