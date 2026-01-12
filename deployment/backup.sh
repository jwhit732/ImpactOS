#!/bin/bash
# Backup script for Impact OS
set -e

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/impact-os-backup-$DATE.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup..."

# Backup .env and package files
cd /home/deploy/impact-os
tar -czf "$BACKUP_FILE" \
  .env \
  package.json \
  package-lock.json 2>/dev/null || true

# Encrypt backup (if gpg is available)
if command -v gpg &> /dev/null; then
  echo "🔒 Encrypting backup..."
  gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase="$(hostname)" "$BACKUP_FILE"
  rm "$BACKUP_FILE"
  echo "✅ Encrypted backup created: $BACKUP_FILE.gpg"
else
  echo "✅ Backup created: $BACKUP_FILE"
  echo "⚠️  WARNING: Backup is not encrypted (gpg not installed)"
fi

# Keep only last 7 days of backups
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "impact-os-backup-*.tar.gz*" -mtime +7 -delete

# Show backup size
if [ -f "$BACKUP_FILE.gpg" ]; then
  SIZE=$(du -h "$BACKUP_FILE.gpg" | cut -f1)
  echo "Backup size: $SIZE"
elif [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup size: $SIZE"
fi

echo "✅ Backup complete"
