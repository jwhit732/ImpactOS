#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Impact OS deployment..."

# Navigate to app directory
cd /home/deploy/impact-os

# Backup current version
echo "📦 Backing up current version..."
rm -rf ../impact-os-backup
cp -r . ../impact-os-backup

# Pull latest code
echo "⬇️  Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📚 Installing dependencies..."
npm ci --production

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Verify .env exists
if [ ! -f .env ]; then
  echo "❌ ERROR: .env file not found!"
  exit 1
fi

# Verify .env permissions
PERMS=$(stat -c %a .env)
if [ "$PERMS" != "600" ]; then
  echo "⚠️  WARNING: .env permissions are $PERMS (should be 600)"
  echo "🔒 Fixing permissions..."
  chmod 600 .env
fi

# Restart service
echo "🔄 Restarting service..."
sudo systemctl restart impact-os

# Wait for service to start
sleep 3

# Check status
if systemctl is-active --quiet impact-os; then
  echo "✅ Deployment successful!"
  echo ""
  echo "📊 Service status:"
  systemctl status impact-os --no-pager -l
  echo ""
  echo "🏥 Health check:"
  curl -s http://localhost:3001/health | jq '.' || echo "Health endpoint not responding yet"
else
  echo "❌ Service failed to start!"
  echo ""
  echo "📋 Recent logs:"
  journalctl -u impact-os -n 50 --no-pager
  exit 1
fi
