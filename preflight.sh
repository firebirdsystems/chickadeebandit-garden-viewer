#!/usr/bin/env bash
# Run before pushing: verifies the build and tests pass.
# Usage:  bash preflight.sh
# Hook:   git config core.hooksPath .githooks  (once per clone)
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Git runs hooks in a non-interactive shell that never sources ~/.zshrc, so nvm's
# node is off PATH. Load it ourselves when node is missing or too old for the build.
node_ok() { command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge 20 ]; }
if ! node_ok; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  for nvm_sh in "/usr/local/opt/nvm/nvm.sh" "/opt/homebrew/opt/nvm/nvm.sh" "$NVM_DIR/nvm.sh"; do
    if [ -s "$nvm_sh" ]; then
      set +e
      # shellcheck disable=SC1090
      . "$nvm_sh" >/dev/null 2>&1
      set -e
      break
    fi
  done
fi
if ! node_ok; then
  echo "✗ Preflight: node 20+ not found on PATH (nvm could not be loaded)." >&2
  exit 1
fi

echo ""
echo "▶ Build…"
node "$ROOT/build.mjs"
echo ""
echo "▶ Tests…"
npm test --prefix "$ROOT"
echo ""
echo "✓ Preflight passed"
