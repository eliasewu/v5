#!/bin/bash
# Deploy without downtime: build while service runs, then quick restart
# Usage: ./deploy.sh [--skip-build] [--force]
#   --skip-build  Skip build + restart, run verification only
#   --force       Skip git status check (for emergency hotfix deploys)
set -e
cd /home/kunshiweb/vos-billing

SKIP_BUILD=false
FORCE=false
while [ $# -gt 0 ]; do
  case "$1" in
    --skip-build) SKIP_BUILD=true ;;
    --force)      FORCE=true ;;
    *)            echo "Unknown flag: $1"; echo "Usage: ./deploy.sh [--skip-build] [--force]"; exit 1 ;;
  esac
  shift
done

if $SKIP_BUILD; then
  echo "[deploy] ⏩ Build skipped (--skip-build) — running verification only"
else
  # Pre-deploy git check: warn on uncommitted changes (staged, unstaged, or untracked)
  if $FORCE; then
    echo "[deploy] ⏩ Git check skipped (--force)"
  else
    echo "[deploy] Checking git status..."
    DIRTY=false
    if git rev-parse --git-dir >/dev/null 2>&1; then
      CHANGES=$(git status --porcelain 2>/dev/null)
      if [ -n "$CHANGES" ]; then
        echo "[deploy] ⚠️  Uncommitted/untracked changes:"
        echo "$CHANGES" | head -15
        DIRTY=true
      fi
    fi
    if $DIRTY; then
      echo "[deploy] ⚠️  Proceeding with uncommitted changes..."
    else
      echo "[deploy] ✅ Git working tree clean"
    fi
  fi

  # Show last commit so you know what's being deployed
  echo -n "[deploy] 📦 Deploying: "
  git log -1 --oneline --no-decorate 2>/dev/null || echo "(no commits)"

  echo "[deploy] Building..."
  npm run build

  echo "[deploy] Quick restart (service stays up during build)..."
  sudo systemctl restart vos-billing
fi

echo "[deploy] Running health verification..."
/home/kunshiweb/vos-billing/check.sh
echo "[deploy] ✅ Deployment complete"
