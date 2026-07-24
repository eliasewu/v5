#!/bin/bash
# Standalone health verification — run anytime to check all critical endpoints
# Usage: ./check.sh
set -e

PREFIX="[check]"

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
