#!/bin/bash
# Rollback script for Impact OS

echo "⏮️  Rolling back to previous version..."

cd /home/deploy

# Check if backup exists
if [ ! -d "impact-os-backup" ]; then
  echo "❌ ERROR: No backup found to rollback to!"
  exit 1
fi

# Stop current service
echo "🛑 Stopping service..."
sudo systemctl stop impact-os

# Archive failed deployment for investigation
echo "📦 Archiving failed deployment..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mv impact-os "impact-os-failed-$TIMESTAMP"

# Restore backup
echo "♻️  Restoring backup..."
cp -r impact-os-backup impact-os

# Reinstall dependencies (in case package.json changed)
cd impact-os
npm ci --production

# Rebuild (in case build changed)
npm run build

# Restart service
echo "🔄 Starting service..."
sudo systemctl start impact-os

# Wait for startup
sleep 3

# Check status
if systemctl is-active --quiet impact-os; then
  echo "✅ Rollback complete!"
  echo ""
  systemctl status impact-os --no-pager -l
else
  echo "❌ Rollback failed! Service did not start."
  echo ""
  journalctl -u impact-os -n 50 --no-pager
  exit 1
fi
