#!/usr/bin/env bash

set -euo pipefail

if [ -n "${BASH_SOURCE[0]:-}" ]; then
  SCRIPT_PATH="${BASH_SOURCE[0]}"
elif [ -n "${ZSH_VERSION:-}" ]; then
  SCRIPT_PATH="${(%):-%N}"
else
  SCRIPT_PATH="$0"
fi

ROOT_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
export SLICK_HOST_HOME="${SLICK_HOST_HOME:-${HOME}}"
export HOME="$ROOT_DIR/.home"
export CARGO_HOME="${CARGO_HOME:-$SLICK_HOST_HOME/.cargo}"
export RUSTUP_HOME="${RUSTUP_HOME:-$SLICK_HOST_HOME/.rustup}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$ROOT_DIR/.cache}"
export PATH="$ROOT_DIR/.home/.local/share/solana/install/active_release/bin:$PATH"
export SOLANA_CONFIG_HOME="$ROOT_DIR/.home/.config/solana"
export PROGRAM_KEYPAIR="$ROOT_DIR/.wallets/monetization-layer-devnet.json"
export DEPLOYER_WALLET="$ROOT_DIR/.wallets/devnet-deployer.json"
export ANCHOR_WALLET="${ANCHOR_WALLET:-$DEPLOYER_WALLET}"

mkdir -p "$HOME" "$SOLANA_CONFIG_HOME" "$XDG_CACHE_HOME"
