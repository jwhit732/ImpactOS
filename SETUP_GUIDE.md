# Impact OS - Setup Guide

This guide walks you through setting up Impact OS from scratch.

## Prerequisites

- Node.js 18 or higher
- A Gmail account
- A Notion account
- A Google AI (Gemini) API key

---

## Step 1: Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd ImpactOS_NodeJS
npm install
```

---

## Step 2: Set Up Notion

### 2.1 Create Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it "Impact OS"
4. Select your workspace
5. Copy the "Internal Integration Token" (starts with `secret_`)

### 2.2 Create Databases

You should already have three databases created:
- **Templates** (ID: `2de06f43-693d-8124-9a4c-ed8b3af61a26`)
- **Commitments** (ID: `2de06f43-693d-81e4-bfd2-c9742dc9efc3`)
- **Logs** (ID: `2de06f43-693d-817f-9f65-f718682f5c7f`)

### 2.3 Share Databases with Integration

For each database:
1. Open the database in Notion
2. Click "..." (top right)
3. Select "Add connections"
4. Find "Impact OS" and connect it

### 2.4 Verify Database Schema

**Templates Database** should have:
- Name (Title)
- Subject Line (Text)
- Email Body (Text)
- Summary Prompt (Text)

**Commitments Database** should have:
- Name (Title)
- Active (Checkbox)
- Frequency (Select: Daily, Weekly, Quarterly)
- Trigger Time (Text, format: HH:MM)
- Cutoff Time (Text, format: HH:MM)
- Template (Relation to Templates)
- Last Sent (Date) ← CRITICAL: Must be added

**Logs Database** should have:
- Commitment (Relation to Commitments)
- Date Sent (Date)
- Thread ID (Text)
- User Reply (Text)
- AI Summary (Text)
- Status (Select: sent, replied, summarized)

---

## Step 3: Set Up Gmail OAuth2

### 3.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 3.2 Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI: `http://localhost:3000/oauth2callback`
5. Copy the **Client ID** and **Client Secret**

### 3.3 Get Refresh Token

This is the tricky part. You'll need to run the OAuth flow once to get a refresh token.

**Option A: Use Google's OAuth Playground**
1. Go to https://developers.google.com/oauthplayground/
2. Click settings (gear icon)
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In Step 1, find "Gmail API v1" and select `https://mail.google.com/`
6. Click "Authorize APIs"
7. Sign in and grant permissions
8. In Step 2, click "Exchange authorization code for tokens"
9. Copy the **Refresh Token**

**Option B: Create a simple Node script** (not implemented yet)

---

## Step 4: Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy the API key

---

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all the values:

   ```env
   # Gmail
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REDIRECT_URI=http://localhost:3000/oauth2callback
   GMAIL_USER_EMAIL=your-email@gmail.com
   GMAIL_REFRESH_TOKEN=your-refresh-token-from-step-3

   # Notion
   NOTION_API_KEY=secret_your_notion_api_key
   NOTION_TEMPLATES_DB_ID=2de06f43-693d-8124-9a4c-ed8b3af61a26
   NOTION_COMMITMENTS_DB_ID=2de06f43-693d-81e4-bfd2-c9742dc9efc3
   NOTION_LOGS_DB_ID=2de06f43-693d-817f-9f65-f718682f5c7f

   # Gemini
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-1.5-flash

   # Scheduler
   POLL_INTERVAL=*/5 * * * *
   TIMEZONE=Australia/Brisbane  # Change to your timezone

   # Debug
   DEBUG=true  # Set to true during testing
   ```

---

## Step 6: Create Test Data in Notion

### 6.1 Create a Template

In the Templates database, create a new page:
- **Name**: Daily Check-in
- **Subject Line**: How did you do today?
- **Email Body**:
  ```
  Hey!

  Quick check-in: How did you progress on your goals today?

  Reply to this email with an update.

  Cheers,
  Impact OS
  ```
- **Summary Prompt**:
  ```
  Summarize this daily check-in update in 2-3 sentences, focusing on progress and next steps:

  {reply}
  ```

### 6.2 Create a Commitment

In the Commitments database, create a new page:
- **Name**: Daily Reflection
- **Active**: ✓ (checked)
- **Frequency**: Daily
- **Trigger Time**: 20:00
- **Cutoff Time**: 23:59
- **Template**: Select "Daily Check-in"
- **Last Sent**: Leave empty (will be auto-filled)

---

## Step 7: Test the System

### 7.1 Test Sending an Email

```bash
npm run send-test
```

You should receive an email with the subject:
```
[IMPACT-{commitment-id}-20260111] How did you do today?
```

### 7.2 Reply to the Email

Reply to the test email with a sample update, e.g.:
```
Made good progress on the project today. Finished the authentication module and started on the dashboard. Tomorrow I'll focus on integrating the API.
```

### 7.3 Test Polling

```bash
npm run poll-test
```

You should see:
- The email you replied to
- Parsed subject token
- Message details

---

## Step 8: Run the Daemon

### Development Mode (with hot reload)

```bash
npm run dev
```

The system will:
- Check commitments every minute
- Poll inbox every 5 minutes
- Send reminders at trigger times
- Process replies and generate summaries

### Production Mode

```bash
npm run build
npm start
```

---

## Step 9: Deploy to VPS (Optional)

### 9.1 Use PM2 for Process Management

```bash
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name impact-os

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 9.2 Monitor Logs

```bash
pm2 logs impact-os
```

---

## Troubleshooting

### Gmail Authentication Issues

If you get "invalid_grant" errors:
- Your refresh token may have expired
- Re-run the OAuth flow to get a new refresh token
- Make sure your OAuth consent screen is configured

### Notion API Errors

- Verify the integration has access to all three databases
- Check that database property names match exactly (case-sensitive)
- Ensure the "Last Sent" property exists on Commitments DB

### Gemini API Errors

- Verify your API key is valid
- Check your quota/rate limits at https://makersuite.google.com/
- The system will gracefully handle failures (reply stored without summary)

### Timezone Issues

- Use IANA timezone strings: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
- Examples: `America/New_York`, `Europe/London`, `Australia/Brisbane`

---

## Next Steps

1. Create more templates for different commitment types
2. Add commitments with various frequencies
3. Monitor the Logs database to see all interactions
4. Adjust trigger times and cutoff times as needed

---

## Key Design Decisions

All critical design decisions are documented in `DESIGN_DECISIONS.md`. Key points:

- Log entries are created BEFORE emails are sent (prevents race conditions)
- All Notion queries use pagination (handles >100 records)
- Mutex prevents concurrent scheduler runs
- Gemini failures are graceful (reply stored, summary left blank)
- Multiple replies to same thread update the existing log

---

## Support

For issues or questions, refer to:
- `DESIGN_DECISIONS.md` - Architecture and edge case handling
- `CLAUDE.md` - Project overview and module interfaces
- `AGENTS_TOOLS.md` - Database IDs and development tools
