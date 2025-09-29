#!/usr/bin/env bash
set -euo pipefail

# Simple installer for bundled Kubo (go-ipfs) to user local bin without sudo.
# Idempotent: reuses existing binary if already installed.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
KUBO_TAR="${ROOT_DIR}/frontend/kubo_v0.29.0_linux-amd64.tar.gz"
KUBO_DIR="${ROOT_DIR}/frontend/kubo"
TARGET_BIN_DIR="$HOME/.local/bin"
TARGET_BIN="$TARGET_BIN_DIR/ipfs"

if [ ! -f "$KUBO_TAR" ]; then
  echo "ERROR: Kubo tarball not found at $KUBO_TAR" >&2
  exit 1
fi

mkdir -p "$TARGET_BIN_DIR"

# Extract if ipfs binary not present yet
if [ ! -d "$KUBO_DIR" ] || [ ! -f "$KUBO_DIR/ipfs" ]; then
  echo "Extracting Kubo..."
  tar -xzf "$KUBO_TAR" -C "${ROOT_DIR}/frontend"
fi

if [ ! -f "$KUBO_DIR/ipfs" ]; then
  echo "ERROR: ipfs binary still not found after extraction." >&2
  exit 1
fi

cp "$KUBO_DIR/ipfs" "$TARGET_BIN" 2>/dev/null || {
  echo "Failed to copy ipfs binary" >&2
  exit 1
}
chmod +x "$TARGET_BIN"

PROFILE_LINE='export PATH="$HOME/.local/bin:$PATH"'
if ! grep -qs "$PROFILE_LINE" "$HOME/.bashrc"; then
  echo "$PROFILE_LINE" >> "$HOME/.bashrc"
  echo "Added path export to ~/.bashrc"
fi

# Ensure PATH in current shell
export PATH="$HOME/.local/bin:$PATH"

echo "Installed ipfs at $TARGET_BIN"
which ipfs || true
ipfs --version || echo "ipfs installed but version check failed"

echo "Next: run 'ipfs init' then 'ipfs daemon' (optional)"
