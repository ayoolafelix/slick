#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/solana-env.sh"

PROGRAM_SO="$ROOT_DIR/target/deploy/monetization_layer.so"
VALIDATOR_DIR="$ROOT_DIR/.validator"
LEDGER_DIR="$VALIDATOR_DIR/ledger"
LOG_FILE="$VALIDATOR_DIR/solana-test-validator.log"
RPC_URL="${SOLANA_RPC_URL:-http://127.0.0.1:8899}"

mkdir -p "$VALIDATOR_DIR" "$LEDGER_DIR"

if [[ ! -f "$DEPLOYER_WALLET" ]]; then
  solana-keygen new --silent --no-bip39-passphrase -o "$DEPLOYER_WALLET"
fi

if pgrep -f "solana-test-validator.*$LEDGER_DIR" >/dev/null 2>&1; then
  pkill -f "solana-test-validator.*$LEDGER_DIR" || true
  for _ in {1..10}; do
    if ! pgrep -f "solana-test-validator.*$LEDGER_DIR" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

nohup solana-test-validator --ledger "$LEDGER_DIR" --reset >"$LOG_FILE" 2>&1 </dev/null &
disown || true

for _ in {1..30}; do
  if solana cluster-version --url "$RPC_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

solana airdrop 100 "$DEPLOYER_WALLET" --url "$RPC_URL" >/dev/null

cargo build-sbf \
  --manifest-path "$ROOT_DIR/programs/monetization_layer/Cargo.toml" \
  --sbf-out-dir "$ROOT_DIR/target/deploy"

solana program deploy \
  --url "$RPC_URL" \
  --keypair "$DEPLOYER_WALLET" \
  --program-id "$PROGRAM_KEYPAIR" \
  "$PROGRAM_SO"
