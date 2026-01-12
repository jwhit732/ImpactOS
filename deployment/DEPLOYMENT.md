# Impact OS - VPS Deployment Guide

## Prerequisites

- VPS running Ubuntu/Debian with SSH access
- Deploy user: `deploy` with sudo access
- SSH key: `C:\Users\jay_e\.ssh\id_ed25519`
- VPS IP: `170.64.195.49`
- Node.js 20.x or higher
- Git installed on VPS

## One-Time VPS Setup

### 1. SSH into VPS

```bash
ssh -i "C:\Users\jay_e\.ssh\id_ed25519" deploy@170.64.195.49
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential jq
```

Verify:
```bash
node --version  # Should be v20.x.x
npm --version
```

### 3. Install Optional Tools

```bash
# For encrypted backups
sudo apt-get install -y gnupg

# For email alerts
sudo apt-get install -y mailutils
```

### 4. Create Directory Structure

```bash
mkdir -p /home/deploy/{scripts,logs,backups}
```

### 5. Clone Repository

```bash
cd /home/deploy
git clone https://github.com/yourusername/impact-os.git
cd impact-os
```

### 6. Transfer .env File

**On local machine:**
```bash
scp -i "C:\Users\jay_e\.ssh\id_ed25519" .env deploy@170.64.195.49:/home/deploy/impact-os/
```

**On VPS:**
```bash
cd /home/deploy/impact-os
chmod 600 .env
chown deploy:deploy .env
```

**Verify .env contents:**
```bash
cat .env  # Should show all required variables
```

### 7. Install Dependencies

```bash
npm ci --production
npm run build
```

### 8. Test Run

```bash
npm start
```

Watch for:
- "Starting Impact OS"
- "Scheduler started"
- "Health check server listening on http://localhost:3001/health"
- No errors

Press Ctrl+C to stop.

### 9. Install systemd Service

**Copy service file:**
```bash
sudo cp /home/deploy/impact-os/deployment/impact-os.service /etc/systemd/system/
sudo systemctl daemon-reload
```

**Enable and start:**
```bash
sudo systemctl enable impact-os
sudo systemctl start impact-os
```

**Check status:**
```bash
systemctl status impact-os
```

**View logs:**
```bash
journalctl -u impact-os -f
```

### 10. Install Deployment Scripts

```bash
cp /home/deploy/impact-os/deployment/*.sh /home/deploy/scripts/
chmod +x /home/deploy/scripts/*.sh
```

### 11. Test Health Check

```bash
/home/deploy/scripts/health-check.sh
```

Should output: `✅ All health checks passed`

### 12. Add Health Check Cron

```bash
crontab -e
```

Add:
```
# Health check every 15 minutes
*/15 * * * * /home/deploy/scripts/health-check.sh || echo "Health check failed at $(date)" | mail -s "[Impact OS] Health Check Failed" jwhit732@gmail.com

# Daily backup at 2 AM
0 2 * * * /home/deploy/scripts/backup.sh
```

## Regular Deployment Workflow

### Deploy New Version

```bash
ssh -i "C:\Users\jay_e\.ssh\id_ed25519" deploy@170.64.195.49
/home/deploy/scripts/deploy.sh
```

The deploy script will:
1. Backup current version
2. Pull latest code from GitHub
3. Install dependencies
4. Build TypeScript
5. Restart service
6. Verify health

### Rollback to Previous Version

```bash
ssh -i "C:\Users\jay_e\.ssh\id_ed25519" deploy@170.64.195.49
/home/deploy/scripts/rollback.sh
```

### View Logs

**Live logs:**
```bash
journalctl -u impact-os -f
```

**Last 100 lines:**
```bash
journalctl -u impact-os -n 100
```

**Errors only:**
```bash
journalctl -u impact-os -p err
```

**Date range:**
```bash
journalctl -u impact-os --since "2026-01-10" --until "2026-01-11"
```

### Check Service Status

```bash
systemctl status impact-os
```

### Restart Service

```bash
sudo systemctl restart impact-os
```

### Stop Service

```bash
sudo systemctl stop impact-os
```

### Start Service

```bash
sudo systemctl start impact-os
```

## Monitoring

### Health Endpoint

```bash
curl http://localhost:3001/health | jq '.'
```

Expected output:
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "memory": {
    "rss": 58720256,
    "heapTotal": 29016064,
    "heapUsed": 24853992,
    "external": 1234567
  },
  "lastPoll": "2026-01-11T03:15:00.000Z",
  "lastCheck": "2026-01-11T03:15:30.000Z",
  "timestamp": "2026-01-11T03:16:00.000Z"
}
```

### Resource Usage

```bash
systemctl status impact-os
```

Look for:
- Memory: Should be < 80MB normally
- CPU: Should be < 5% normally
- Tasks: Should be < 15

## Troubleshooting

### Service Won't Start

```bash
# Check logs
journalctl -u impact-os -n 50

# Common fixes
cd /home/deploy/impact-os
chmod 600 .env
npm ci --production
npm run build
sudo systemctl restart impact-os
```

### High Memory Usage

```bash
# Check current usage
systemctl status impact-os | grep Memory

# Restart service
sudo systemctl restart impact-os
```

### Gmail Authentication Failed

```bash
# Re-run OAuth setup
cd /home/deploy/impact-os
npm run auth:gmail

# Copy new refresh token to .env
nano .env  # Update GMAIL_REFRESH_TOKEN

# Restart service
sudo systemctl restart impact-os
```

### Health Check Failing

```bash
# Test health endpoint directly
curl http://localhost:3001/health

# If no response, check if service is running
systemctl status impact-os

# Check for port conflicts
lsof -i :3001
```

## Security Checklist

- [ ] .env file has 600 permissions
- [ ] .env is NOT in git (check .gitignore)
- [ ] Service runs as non-root user (deploy)
- [ ] SSH key-only authentication enabled
- [ ] Firewall configured (ufw)
- [ ] Automatic security updates enabled
- [ ] Backups are encrypted
- [ ] Health check cron is active

## Performance Benchmarks

**Normal operation:**
- Memory: 40-60MB
- CPU: <1% idle, ~5% during polling
- Disk I/O: Minimal
- Network: <1KB/s average

**Red flags:**
- Memory > 80MB sustained
- CPU > 10% sustained
- Health checks failing
- No logs for > 10 minutes

## Maintenance Schedule

**Daily:**
- Automated backup (2 AM via cron)
- Health checks (every 15 minutes via cron)

**Weekly:**
- Review logs for errors
- Check resource usage trends

**Monthly:**
- Review and rotate API keys (if needed)
- Update dependencies (npm update)
- Review backup integrity

**Quarterly:**
- Gmail OAuth refresh (if needed)
- Review and update documentation

## Emergency Contacts

- **Email:** jwhit732@gmail.com
- **VPS Provider:** [Your VPS provider]
- **Notion Support:** https://www.notion.so/help

## Additional Resources

- [systemd documentation](https://www.freedesktop.org/software/systemd/man/)
- [journalctl cheat sheet](https://www.digitalocean.com/community/tutorials/how-to-use-journalctl-to-view-and-manipulate-systemd-logs)
- [Node.js production best practices](https://nodejs.org/en/docs/guides/simple-profiling/)
