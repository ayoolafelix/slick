#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/solana-env.sh"

export SOLANA_RPC_URL="${SOLANA_RPC_URL:-http://127.0.0.1:8899}"
export MONETIZATION_PROGRAM_ID="$(solana-keygen pubkey "$PROGRAM_KEYPAIR")"

bash "$ROOT_DIR/scripts/local-deploy.sh"
node "$ROOT_DIR/web/scripts/local-smoke-test.mjs"
