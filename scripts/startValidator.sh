#!/usr/bin/env bash
set -euo pipefail

ID=${ID:-$HOME/validator-keypair.json}
LEDGER=${LEDGER:-$HOME/dopel-ledger}

solana-validator \
  --identity "$ID" \
  --ledger "$LEDGER" \
  --rpc-port 8899 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --dynamic-port-range 8000-8010 \
  --full-rpc-api \
  --limit-ledger-size

