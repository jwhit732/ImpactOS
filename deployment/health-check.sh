#!/bin/bash
# Health check script for Impact OS

# Check if service is running
if ! systemctl is-active --quiet impact-os; then
  echo "❌ Service is not running"
  exit 1
fi

# Check HTTP endpoint
if ! curl -sf http://localhost:3001/health > /dev/null; then
  echo "❌ Health endpoint not responding"
  exit 1
fi

# Get health data
HEALTH=$(curl -s http://localhost:3001/health)

# Check last poll time (should be < 10 minutes ago)
LAST_POLL=$(echo "$HEALTH" | jq -r '.lastPoll')

if [ "$LAST_POLL" != "null" ]; then
  LAST_POLL_TIMESTAMP=$(date -d "$LAST_POLL" +%s 2>/dev/null || echo "0")
  NOW=$(date +%s)
  DIFF=$((NOW - LAST_POLL_TIMESTAMP))

  if [ "$DIFF" -gt 600 ]; then
    echo "❌ Last poll was $DIFF seconds ago (> 10 minutes)"
    echo "Last poll: $LAST_POLL"
    exit 1
  fi
fi

# Check memory usage
MEMORY=$(echo "$HEALTH" | jq -r '.memory.heapUsed')
MEMORY_MB=$((MEMORY / 1024 / 1024))

if [ "$MEMORY_MB" -gt 90 ]; then
  echo "⚠️  WARNING: Memory usage is ${MEMORY_MB}MB (approaching limit)"
fi

echo "✅ All health checks passed"
echo "Uptime: $(echo "$HEALTH" | jq -r '.uptime') seconds"
echo "Memory: ${MEMORY_MB}MB"
echo "Last poll: $LAST_POLL"
exit 0
