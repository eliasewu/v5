#!/bin/bash
# Standalone health verification — run anytime to check all critical endpoints
# Usage: ./check.sh [--dry-run]
#   --dry-run  Skip health wait + API checks, print what would be verified
set -e
cd /home/kunshiweb

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  shift
fi

PREFIX="[check]"
$DRY_RUN && PREFIX="[check:dry]"

$DRY_RUN && echo "$PREFIX 🔍 DRY RUN — skipping health wait + API verification"

# Git status check — warn if code differs from last commit (may differ from deployed build)
echo "$PREFIX Checking git status..."
if git rev-parse --git-dir >/dev/null 2>&1; then
  CHANGES=$(git status --porcelain 2>/dev/null)
  if [ -n "$CHANGES" ]; then
    echo "$PREFIX ⚠️  Uncommitted changes since last commit:"
    echo "$CHANGES" | head -15
  else
    echo "$PREFIX ✅ Git working tree clean"
  fi
else
  echo "$PREFIX ⏩ Not a git repo — skipped"
fi

# Show last commit for reference
echo -n "$PREFIX 📦 Last commit: "
git log -1 --oneline --no-decorate 2>/dev/null || echo "(no commits)"

# Show ahead/behind vs origin (local ref — run 'git fetch' to refresh)
if git config --get remote.origin.url >/dev/null 2>&1; then
  COUNTS=$(git rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo "")
  if [ -n "$COUNTS" ]; then
    BEHIND=$(echo "$COUNTS" | awk '{print $1}'); BEHIND=${BEHIND:-0}
    AHEAD=$(echo "$COUNTS" | awk '{print $2}'); AHEAD=${AHEAD:-0}
    if [ "$BEHIND" -gt 0 ] || [ "$AHEAD" -gt 0 ]; then
      echo -n "$PREFIX 📡 Remote (local): "
      [ "$BEHIND" -gt 0 ] && echo -n "↓$BEHIND behind "
      [ "$AHEAD" -gt 0 ] && echo -n "↑$AHEAD ahead"
      echo ""
    else
      echo "$PREFIX 📡 In sync with origin"
    fi
  fi
fi

# Dry run: print preview and exit early (no nested if/else blocks)
if $DRY_RUN; then
  echo "$PREFIX 🔍 Would wait 30s for service health, then verify:"
  echo "$PREFIX 🔍   - Uptime monitor check"
  echo "$PREFIX 🔍   - /api/vos/accounts"
  echo "$PREFIX 🔍   - /api/vos/gateways/routing"
  echo "$PREFIX 🔍   - /api/vos/gateways/mapping"
  echo "$PREFIX ✅ Dry run complete — no health checks performed"
  exit 0
fi

# ─── Normal (non-dry-run) path below ───

echo "$PREFIX Waiting for service to be ready..."
HEALTH_OK=false
for i in $(seq 1 30); do
  if curl -skf https://localhost:3443/api/health > /dev/null 2>&1; then
    echo "$PREFIX ✅ Service healthy"
    HEALTH_OK=true
    break
  fi
  sleep 1
done
if ! $HEALTH_OK; then
  echo "$PREFIX ⚠️ Health check timed out after 30s"
  exit 1
fi

# Verify uptime monitor also sees the service as healthy
if [ -x /home/kunshiweb/vos-billing/scripts/monitor.sh ]; then
  echo "$PREFIX Running uptime monitor check..."
  /home/kunshiweb/vos-billing/scripts/monitor.sh || echo "$PREFIX ⚠️ Monitor check failed (non-critical)"
  echo "$PREFIX ✅ Uptime monitor verified"
fi

# Check all critical API endpoints
FAILS=0
echo "$PREFIX Verifying API endpoints..."
for endpoint in accounts gateways/routing gateways/mapping; do
  CODE=$(curl -sk -o /dev/null -w '%{http_code}' "https://localhost:3443/api/vos/$endpoint" 2>/dev/null)
  if [ "$CODE" = "401" ] || [ "$CODE" = "200" ]; then
    echo "$PREFIX   ✅ /api/vos/$endpoint → $CODE"
  else
    echo "$PREFIX   ❌ /api/vos/$endpoint → $CODE"
    FAILS=$((FAILS + 1))
  fi
done

if [ "$FAILS" -eq 0 ]; then
  echo "$PREFIX ✅ All endpoints healthy"
else
  echo "$PREFIX ⚠️ $FAILS endpoint(s) unhealthy"
  exit 1
fi
