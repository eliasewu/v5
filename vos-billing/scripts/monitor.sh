#!/bin/bash
# Uptime monitor — checks /api/health every run, alerts on consecutive failures
set -e

HEALTH_URL="https://localhost:3443/api/health"
STATE_FILE="/tmp/vos-monitor.state"
MAX_FAILURES=3

# Read previous failure count
failures=0
if [ -f "$STATE_FILE" ]; then
  failures=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
fi

# Check health
if curl -skf "$HEALTH_URL" --max-time 10 > /dev/null 2>&1; then
  # Service is up
  if [ "$failures" -ge "$MAX_FAILURES" ]; then
    echo "[monitor] ✅ RECOVERED — service back online after $failures failures"
  fi
  echo 0 > "$STATE_FILE"
else
  # Service is down
  failures=$((failures + 1))
  echo "$failures" > "$STATE_FILE"
  echo "[monitor] ❌ DOWN — failure $failures/$MAX_FAILURES at $(date)"

  if [ "$failures" -ge "$MAX_FAILURES" ]; then
    echo "[monitor] 🚨 ALERT: VOS Billing has been down for $((failures * 60)) seconds!"
    # Sync SMTP config from DB and send email alert
    /home/kunshiweb/vos-billing/scripts/sync-smtp-config.sh 2>/dev/null
    echo "VOS Billing DOWN at $(date) — $failures consecutive failures | Server: $(hostname) | Health check: $HEALTH_URL" | mail -s "🚨 VOS Billing DOWN" deviceinfo@triangletrade.net || echo "[monitor] ⚠️ Email send failed (check msmtp: sudo cat /var/log/msmtp.log)"
  fi
fi
