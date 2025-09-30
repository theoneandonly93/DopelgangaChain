#!/usr/bin/env bash
set -euo pipefail

# Safe push helper for DopelgangaChain
# - Ensures secrets are ignored
# - Untracks accidental secrets already staged/tracked
# - Commits changes and optionally sets remote + pushes

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -z "${ROOT_DIR}" ]]; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi
cd "${ROOT_DIR}"

echo "Repo root: ${ROOT_DIR}"

ensure_ignored() {
  local pattern="$1"
  if ! grep -qxF "${pattern}" .gitignore 2>/dev/null; then
    echo "${pattern}" >> .gitignore
    echo "Added to .gitignore: ${pattern}"
  fi
}

echo "Ensuring ignore rules..."
# Already ignores .env* globally, but ensure common key patterns too
ensure_ignored "dev1-*.json"
ensure_ignored "*keypair.json"
ensure_ignored "program/target/"

echo "Removing tracked secrets from index (if any)..."
remove_if_tracked() {
  local pat="$1"
  # list tracked files matching pattern
  mapfile -d '' files < <(git ls-files -z -- "${pat}" || true)
  if (( ${#files[@]} )); then
    git rm --cached --quiet -- "${pat}" || true
    for f in "${files[@]}"; do
      [[ -n "$f" ]] && echo "Untracked from git: $f"
    done
  fi
}

remove_if_tracked ".env"
remove_if_tracked "indexer/.env"
remove_if_tracked "frontend/.env"
remove_if_tracked "dev1-*.json"
remove_if_tracked "*keypair.json"

echo "Staging .gitignore and related changes..."
git add .gitignore || true

if ! git diff --staged --quiet; then
  git commit -m "chore: safe push – ignore secrets and untrack local env/key files" || true
else
  echo "No staged changes to commit."
fi

echo
echo "Remotes:"
git remote -v || true

if ! git remote get-url origin >/dev/null 2>&1; then
  read -r -p "No 'origin' remote found. Enter GitHub remote URL (or leave blank to skip): " REMOTE_URL || true
  if [[ -n "${REMOTE_URL:-}" ]]; then
    git remote add origin "${REMOTE_URL}"
    echo "Added origin: ${REMOTE_URL}"
  fi
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
read -r -p "Push branch name [${CURRENT_BRANCH:-main}]: " BRANCH || true
BRANCH=${BRANCH:-${CURRENT_BRANCH:-main}}

read -r -p "Push to origin/${BRANCH}? [y/N]: " CONFIRM || true
if [[ "${CONFIRM,,}" == "y" || "${CONFIRM,,}" == "yes" ]]; then
  # Ensure branch name
  git branch -M "${BRANCH}"
  git push -u origin "${BRANCH}"
else
  echo "Skip push. You can run: git push -u origin ${BRANCH}"
fi

echo "Done."

