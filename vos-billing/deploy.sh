#!/bin/bash
# Deploy without downtime: build while service runs, then quick restart
# Usage: ./deploy.sh [--skip-build] [--force] [--dry-run]
#   --skip-build  Skip build + restart, run verification only
#   --force       Skip git status check (for emergency hotfix deploys)
#   --dry-run     Print what would happen without actually building or restarting
set -e
cd /home/kunshiweb/vos-billing

SKIP_BUILD=false
FORCE=false
DRY_RUN=false
while [ $# -gt 0 ]; do
  case "$1" in
    --skip-build) SKIP_BUILD=true ;;
    --force)      FORCE=true ;;
    --dry-run)    DRY_RUN=true ;;
    *)            echo "Unknown flag: $1"; echo "Usage: ./deploy.sh [--skip-build] [--force] [--dry-run]"; exit 1 ;;
  esac
  shift
done

if $DRY_RUN; then
  echo "[deploy] 🔍 DRY RUN — no build, no restart, no verification"
fi

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

  # Show ahead/behind vs origin (local ref — run 'git fetch' to refresh)
  if git config --get remote.origin.url >/dev/null 2>&1; then
    COUNTS=$(git rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo "")
    if [ -n "$COUNTS" ]; then
      BEHIND=$(echo "$COUNTS" | awk '{print $1}'); BEHIND=${BEHIND:-0}
      AHEAD=$(echo "$COUNTS" | awk '{print $2}'); AHEAD=${AHEAD:-0}
      if [ "$BEHIND" -gt 0 ] || [ "$AHEAD" -gt 0 ]; then
        echo -n "[deploy] 📡 Remote (local): "
        [ "$BEHIND" -gt 0 ] && echo -n "↓$BEHIND behind "
        [ "$AHEAD" -gt 0 ] && echo -n "↑$AHEAD ahead"
        echo ""
        if [ "$AHEAD" -gt 0 ]; then
          echo "[deploy] ⚠️  $AHEAD unpushed commit(s) — run 'git push' before deploying"
        fi
      else
        echo "[deploy] 📡 In sync with origin"
      fi
    fi
  fi

  if $DRY_RUN; then
    echo "[deploy] 🔍 Would build: npm run build"
    echo "[deploy] 🔍 Would restart: sudo systemctl restart vos-billing"
  else
    echo "[deploy] Building..."
    npm run build

    echo "[deploy] Quick restart (service stays up during build)..."
    sudo systemctl restart vos-billing
  fi
fi

if $DRY_RUN; then
  echo "[deploy] 🔍 Would verify: /home/kunshiweb/vos-billing/check.sh"
  echo "[deploy] ✅ Dry run complete — no changes made"
else
  echo "[deploy] Running health verification..."
  /home/kunshiweb/vos-billing/check.sh
  echo "[deploy] ✅ Deployment complete"
fi
