# Impact OS — Complete Project Specification

**Version**: 2.0 (Node.js)  
**Last Updated**: January 2026

---

## Table of Contents

1. [Origin & Philosophy](#1-origin--philosophy)
2. [Purpose](#2-purpose)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Core Design Principles](#4-core-design-principles)
5. [High-Level Architecture](#5-high-level-architecture)
6. [Data Model (Notion)](#6-data-model-notion)
7. [Execution Flows](#7-execution-flows)
8. [Subject Token Specification](#8-subject-token-specification)
9. [Reporting](#9-reporting)
10. [Stability & Error Handling](#10-stability--error-handling)
11. [Security & Privacy](#11-security--privacy)
12. [Credentials Setup](#12-credentials-setup)
13. [Project Structure](#13-project-structure)
14. [Deployment](#14-deployment)
15. [Claude Code Context](#15-claude-code-context)
16. [Development Sessions Plan](#16-development-sessions-plan)
17. [Success Criteria](#17-success-criteria)
18. [Future Extensions](#18-future-extensions)

---

## 1. Origin & Philosophy

This project originates from a structured behavior and performance framework inspired by Daniel Pink's work on motivation, follow-through, and systems design. The core insight is that **structure beats inspiration**: durable performance improvements come from external systems that reduce cognitive load, enforce cadence, and create feedback loops.

### Personal Context

* A 2026 focus theme of **IMPACT**
* A desire to eliminate overconsumption (doom scrolling, passive media)
* A need to compound daily, weekly, and quarterly reflection into measurable professional impact
* A preference for terminal-driven, code-first systems ("vibe coding")

### Result

A **personal operating system** that externalizes time, accountability, reflection, and review.

**Impact OS is not a productivity app.** It is an externalized thinking and accountability system designed to run quietly, reliably, and for an entire year without requiring motivation.

---

## 2. Purpose

**Impact OS** is a headless, local-first orchestration system that:

* Drives recurring, time-based commitments
* Uses email as the primary execution and reflection interface
* Uses AI only where cognition, not compliance, is the bottleneck
* Produces durable, reviewable evidence of progress over time

The system must continue to function even when motivation is low.

---

## 3. Goals & Non-Goals

### Functional Goals

* Enforce daily / weekly / quarterly reflection without manual setup
* Make task completion unambiguous (reply = done)
* Capture reflection data once and reuse it for reporting
* Support ad hoc deep-thinking sessions via AI
* Generate structured weekly, monthly, and quarterly reviews

### Non-Goals

* Real-time collaboration
* Multi-user workflow management
* Gamification or habit streak visualizations
* Heavy UI or dashboarding
* Complex Pub/Sub infrastructure (polling is sufficient)

---

## 4. Core Design Principles

1. **Structure over willpower**  
   The system provides time-based prompts and cutoffs; the user only responds.

2. **Single surface of action**  
   Email is the default interface. No app switching is required for daily use.

3. **Selective AI usage**  
   AI is used for summarization, extraction, and critique — not for reminders or scheduling.

4. **Human-readable, machine-parseable**  
   Templates are readable by humans but structured enough for reliable parsing.

5. **Deterministic behavior**  
   No fuzzy automation decisions. Rules are explicit and auditable.

6. **Simplicity over sophistication**  
   Gmail polling beats Pub/Sub complexity for <10 emails/day.

---

## 5. High-Level Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     VPS (170.64.195.49)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Node.js/TypeScript Daemon (PM2)            │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │    │
│  │  │Scheduler │  │  Gmail   │  │  Notion  │  │Summarizer│ │    │
│  │  │          │  │          │  │          │  │ (Gemini) │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                │                │                │
         ▼                ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  Cron   │      │  Gmail  │      │ Notion  │      │ Gemini  │
    │ (local) │      │   API   │      │   API   │      │   API   │
    └─────────┘      └─────────┘      └─────────┘      └─────────┘
```

### Node.js Daemon

* Always-on, headless orchestration engine
* TypeScript for type safety
* Internal cron via `node-cron` (not system crontab)
* Managed by PM2 for process reliability

### Gmail (Polling Model)

* **Outbound**: Send reminders with subject token `[IMPACT-{commitmentId}-{YYYYMMDD}]`
* **Inbound**: Poll inbox every 5 minutes via cron
* **Query**: `subject:[IMPACT- is:unread` — no Pub/Sub required
* **Processing**: Mark as read after successful processing
* **Benefit**: Android push notifications come free via Gmail app

### Notion (System of Record)

* Templates database
* Commitments database  
* Logs database
* Review pages (auto-generated)

### Gemini Flash (AI Processing)

* Summarize messy replies
* Extract decisions and action items
* Determine completion status (Done/Partial/Unclear)
* Handle special coaching/challenger sessions

---

## 6. Data Model (Notion)

> **Note**: Databases already created and configured with test data.

### 6.1 Templates Database

**Database ID**: `2de06f43-693d-8124-9a4c-ed8b3af61a26`

Each row represents a reusable email + reflection template.

| Property      | Type              | Description                        |
|---------------|-------------------|------------------------------------|
| Name          | Title             | Template name                      |
| Type          | Select            | Daily, Weekly, Quarterly, Thank-you|
| Active        | Checkbox          | Whether template is in use         |
| Email Subject | Text              | Subject line template              |
| Last Updated  | Last edited time  | Auto-updated                       |

**Page body contains:**
* Email body template (Markdown)
* Reflection questions
* Optional parsing hints for AI

**Example Template Body:**
```markdown
## Daily Reflection

Take 5 minutes to reflect on your day.

**Questions:**
1. What was your biggest win today?
2. What challenged you?
3. What will you do differently tomorrow?

---
Reply to this email with your answers.
```

### 6.2 Commitments Database

**Database ID**: `2de06f43-693d-81e4-bfd2-c9742dc9efc3`

Defines what runs and when.

| Property     | Type     | Description                              |
|--------------|----------|------------------------------------------|
| Name         | Title    | e.g., "Daily Reflection"                 |
| Slug         | Text     | URL-safe ID: `daily-reflection`          |
| Template     | Relation | → Templates database                     |
| Frequency    | Select   | Daily, Weekly, Quarterly                 |
| Trigger Time | Text     | 24h format: `09:00`                      |
| Cutoff Time  | Text     | 24h format: `22:00`                      |
| Days         | Multi-select | Mon, Tue, Wed, Thu, Fri, Sat, Sun (for Weekly) |
| Active       | Checkbox | Whether commitment is active             |

### 6.3 Logs Database

**Database ID**: `2de06f43-693d-817f-9f65-f718682f5c7f`

Append-only record of execution.

| Property   | Type     | Description                              |
|------------|----------|------------------------------------------|
| Name       | Title    | Auto: `{Commitment} - {YYYY-MM-DD}`      |
| Commitment | Relation | → Commitments database                   |
| Date       | Date     | Date of commitment                       |
| Status     | Select   | Done, Partial, Skipped, Unclear, Awaiting Reply |
| Summary    | Text     | AI-generated summary                     |
| Actions    | Text     | Extracted action items (newline-separated) |
| Raw Input  | Text     | Original reply text                      |
| Thread ID  | Text     | Gmail thread ID (for idempotency)        |
| Source     | Select   | Email, Manual                            |
| Created    | Created time | Auto-timestamp                        |

### 6.4 Reviews Page

**Page ID**: `2de06f43-693d-8089-9ddc-f0b4cb09a690`

Parent page for generated weekly/monthly/quarterly reviews.

---

## 7. Execution Flows

### 7.1 Reminder Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scheduler  │────▶│   Notion    │────▶│   Render    │────▶│   Gmail     │
│  (cron)     │     │   Query     │     │   Email     │     │   Send      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. Scheduler checks due commitments (runs every minute)
2. For each due commitment:
   a. Fetch template content from Notion
   b. Render email with:
      - Subject: `[IMPACT-{slug}-{YYYYMMDD}] {Template Subject}`
      - Body: Template content with any variable substitution
      - Links: Optional Notion page link
   c. Send via Gmail API
   d. Create log entry with Status: "Awaiting Reply"

### 7.2 Completion Flow (Polling)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Gmail     │────▶│   Parse     │────▶│   Gemini    │────▶│   Notion    │
│   Poll      │     │   Reply     │     │  Summarize  │     │   Log       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. Cron job runs every 5 minutes
2. Query Gmail API: `q: "subject:[IMPACT- is:unread"`
3. For each matching message:
   ```
   a. Extract commitment ID and date from subject token via regex
   b. Check Notion Logs for existing entry with this Gmail Thread ID
   c. If no existing log (idempotency check passed):
      - Parse reply body:
        • Strip quoted text (below "---" or "On ... wrote:")
        • Strip email signature (detect via "--" delimiter)
        • Trim whitespace
      - Send cleaned text to Gemini:
        • Summarize in 1-2 sentences
        • Extract action items as bullet list
        • Determine status: Done (substantive), Partial (brief), Unclear (minimal)
      - Update existing "Awaiting Reply" log or create new log entry
   d. Mark email as read via Gmail API
   ```
4. Errors: Log locally, leave email unread for retry on next poll

### 7.3 Miss Detection

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scheduler  │────▶│   Notion    │────▶│   Gmail     │
│  (cutoff+30)│     │   Check     │     │   Nudge     │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. Scheduled job runs at `cutoff_time + 30 minutes` for each commitment
2. Query Notion Logs: Is there a log for this commitment + today with Status != "Awaiting Reply"?
3. If no qualifying log exists:
   a. Find original reminder thread via Thread ID in "Awaiting Reply" log
   b. Send nudge as reply to original thread (keeps inbox clean)
   c. Update log Status to "Skipped" if still no response by midnight
4. **One nudge maximum per commitment per day** — no repeated nagging

### 7.4 Special Sessions (AI Coaching)

Used only for non-routine, high-leverage thinking.

1. User initiates AI session intentionally (via separate interface)
2. AI outputs structured JSON with insights, challenges, recommendations
3. Webhook receives payload
4. Log is written and tagged as "Special Session"

*Note: This is a v2 feature and can be deferred.*

---

## 8. Subject Token Specification

### Format

```
[IMPACT-{commitmentSlug}-{YYYYMMDD}]
```

### Examples

```
[IMPACT-daily-reflection-20260110] Daily Reflection
[IMPACT-weekly-review-20260112] Weekly Review
[IMPACT-q1-planning-20260115] Q1 Planning Session
```

### Components

| Component      | Description                              | Example              |
|----------------|------------------------------------------|----------------------|
| `IMPACT`       | Fixed prefix for Gmail query filtering   | `IMPACT`             |
| `commitmentSlug` | Slug from Commitments database         | `daily-reflection`   |
| `YYYYMMDD`     | Date commitment was triggered            | `20260110`           |

### Parsing

```typescript
const TOKEN_REGEX = /\[IMPACT-([a-z0-9-]+)-(\d{8})\]/i;

function parseSubjectToken(subject: string): { slug: string; date: string } | null {
  const match = subject.match(TOKEN_REGEX);
  if (!match) return null;
  return {
    slug: match[1],
    date: match[2], // YYYYMMDD format
  };
}

function createSubjectToken(slug: string, date: Date): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `[IMPACT-${slug}-${dateStr}]`;
}
```

### Benefits

* Reliable reply detection via simple Gmail search
* Commitment identification without parsing email body
* Date tracking for idempotency checks
* Human-readable in inbox

---

## 9. Reporting

### Scheduled Report Generation

| Report    | Schedule        | Content                                    |
|-----------|-----------------|-------------------------------------------|
| Weekly    | Sunday 8pm      | Aggregate week's logs, highlight patterns |
| Monthly   | 1st of month    | Monthly rollup, trends, unclear items     |
| Quarterly | End of quarter  | Quarter review, goal progress             |

### Report Contents

* Completion rate by commitment type
* Summary of key reflections
* List of extracted actions (deduplicated)
* Unclear items requiring attention
* Generated as Notion page under Reviews Page (`2de06f43-693d-8089-9ddc-f0b4cb09a690`)

---

## 10. Stability & Error Handling

### Idempotency

* Gmail Thread ID stored in Notion Logs
* Check for existing Thread ID before creating new log
* Prevents duplicate processing on retry or multiple poll cycles

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};
```

### Error Handling by Service

| Service | Failure Mode | Handling |
|---------|--------------|----------|
| Gmail (poll) | API error | Log error, retry next cycle |
| Gmail (send) | API error | Retry with backoff, alert after 3 failures |
| Notion | API error | Retry with backoff, queue for later |
| Gemini | API error | Log with Status "Unclear", preserve raw input |
| Gemini | Quota exceeded | Fall back to simple parsing, no AI summary |

### Health Monitoring

* Structured logging with timestamps and correlation IDs
* Optional: Health check endpoint for uptime monitoring
* PM2 auto-restart on crash

### Requirements

* Timezone-safe scheduling (use `luxon` or `date-fns-tz`)
* No hard dependency on UI availability
* Graceful degradation if external APIs fail

---

## 11. Security & Privacy

### Secrets Management

* All secrets in environment variables (`.env` file)
* Never committed to repository
* `.env` in `.gitignore`

### OAuth Scopes (Least Privilege)

**Gmail:**
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
```

**Notion:**
* Internal integration (workspace-scoped)
* Only shared with specific databases

### Data Privacy

* Logs contain only necessary personal data
* Raw email content stored in Notion (your workspace)
* Gemini API processes content but doesn't store it
* No data shared with third parties beyond API providers

### Trust Boundaries

Cloud APIs (Gmail, Notion, Gemini) are inherent trust boundaries. Accept this for a personal system.

---

## 12. Credentials Setup

### 12.1 Current Status

| Service | Status | Notes |
|---------|--------|-------|
| Notion API | ✅ Configured | Token and all database IDs ready |
| Gmail OAuth | ⚠️ Partial | Need Client ID, Secret, Refresh Token |
| Gemini API | ⚠️ Needed | Need API key from AI Studio |
| VPS | ✅ Ready | 170.64.195.49, SSH configured |

### 12.2 Gmail API (OAuth2) — ACTION REQUIRED

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `Impact OS`
3. Enable **Gmail API**: APIs & Services → Library → Gmail API → Enable

#### Step 2: Configure OAuth Consent Screen

1. APIs & Services → OAuth consent screen
2. User Type: **External**
3. Fill in:
   - App name: `Impact OS`
   - User support email: `jwhit732@gmail.com`
   - Developer contact: `jwhit732@gmail.com`
4. Scopes: Skip (click Save and Continue)
5. Test users: Add `jwhit732@gmail.com`
6. Save and Continue → Back to Dashboard

#### Step 3: Create OAuth Credentials

1. APIs & Services → Credentials → Create Credentials → **OAuth client ID**
2. Application type: **Desktop app**
3. Name: `Impact OS CLI`
4. Click Create
5. Download JSON → save as `credentials.json` in project root

#### Step 4: Generate Refresh Token

Run the setup script (one-time):

```bash
npm run auth:gmail
```

This will:
1. Open browser for OAuth consent
2. Save tokens to `.env` automatically

### 12.3 Notion API — ✅ CONFIGURED

**API Key**: `ntn_B18666888292q3hJBJLM0XHYElYWBoel7Fc2gtt6i493S5`

**Database IDs**:
| Database | ID |
|----------|-----|
| Templates | `2de06f43-693d-8124-9a4c-ed8b3af61a26` |
| Commitments | `2de06f43-693d-81e4-bfd2-c9742dc9efc3` |
| Logs | `2de06f43-693d-817f-9f65-f718682f5c7f` |
| Reviews Page | `2de06f43-693d-8089-9ddc-f0b4cb09a690` |

Databases are already created with test data and shared with the integration.

### 12.4 Gemini API — ACTION REQUIRED

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API key"
3. Copy the key (starts with `AIza`)
4. Add to `.env` as `GEMINI_API_KEY`

### 12.5 Environment Configuration

Your `.env` file (copy from `.env.example`):

```env
# Gmail OAuth2 - FILL THESE IN
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=

# Notion - ✅ CONFIGURED
NOTION_API_KEY=ntn_B18666888292q3hJBJLM0XHYElYWBoel7Fc2gtt6i493S5
NOTION_TEMPLATES_DB=2de06f43-693d-8124-9a4c-ed8b3af61a26
NOTION_COMMITMENTS_DB=2de06f43-693d-81e4-bfd2-c9742dc9efc3
NOTION_LOGS_DB=2de06f43-693d-817f-9f65-f718682f5c7f
NOTION_REVIEWS_PAGE=2de06f43-693d-8089-9ddc-f0b4cb09a690

# Gemini - FILL THIS IN
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# App Config - ✅ CONFIGURED
YOUR_EMAIL=jwhit732@gmail.com
TIMEZONE=Australia/Brisbane
POLL_INTERVAL_MINUTES=5
LOG_LEVEL=info
```

### 12.6 VPS Access — ✅ CONFIGURED

**IP Address**: `170.64.195.49`

**SSH Access**:
```powershell
ssh -i "C:\Users\jay_e\.ssh\id_ed25519" deploy@170.64.195.49
```

**Domain**: `impact-os.smartaisolutions.au` (Cloudflare tunnel configured)

### 12.7 Verification

Run the test script after filling in missing credentials:

```bash
npm run test:credentials
```

Verifies:
- [ ] Gmail API can list messages
- [ ] Gmail API can send test email
- [ ] Notion API can query each database
- [ ] Gemini API responds to test prompt

---

## 13. Project Structure

```
impact-os/
├── src/
│   ├── index.ts              # Entry point, cron setup
│   ├── scheduler.ts          # Check due commitments, trigger sends
│   ├── gmail.ts              # Send, poll, parse emails
│   ├── notion.ts             # CRUD for all databases
│   ├── summarizer.ts         # Gemini API wrapper
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── config.ts             # Environment variable loading
│   └── utils/
│       ├── email-parser.ts   # Strip quotes, signatures
│       ├── subject-token.ts  # Generate/parse tokens
│       ├── logger.ts         # Structured logging
│       └── retry.ts          # Exponential backoff helper
├── scripts/
│   ├── gmail-auth.ts         # One-time OAuth setup
│   ├── test-credentials.ts   # Verify all API connections
│   ├── send-test-reminder.ts # Manual test send
│   └── poll-inbox.ts         # Manual test poll
├── .env                      # Environment variables (not committed)
├── .env.example              # Template for .env
├── .gitignore
├── credentials.json          # Gmail OAuth credentials (not committed)
├── package.json
├── tsconfig.json
├── ecosystem.config.js       # PM2 configuration
├── CLAUDE.md                 # Claude Code context (see Section 15)
└── README.md
```

### Package Dependencies

```json
{
  "dependencies": {
    "googleapis": "^140.0.0",
    "node-cron": "^3.0.3",
    "@notionhq/client": "^2.2.15",
    "@google/generative-ai": "^0.21.0",
    "dotenv": "^16.4.5",
    "luxon": "^3.4.4"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "ts-node-dev": "^2.0.0",
    "@types/node": "^20.0.0",
    "@types/node-cron": "^3.0.11",
    "@types/luxon": "^3.4.2",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  }
}
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "auth:gmail": "ts-node scripts/gmail-auth.ts",
    "test:credentials": "ts-node scripts/test-credentials.ts",
    "send:test": "ts-node scripts/send-test-reminder.ts",
    "poll:test": "ts-node scripts/poll-inbox.ts",
    "lint": "eslint 'src/**/*.ts'",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 14. Deployment

### Local Development

```bash
# Install dependencies
npm install

# Set up credentials
cp .env.example .env
# Edit .env with your values

# Run Gmail OAuth (one-time)
npm run auth:gmail

# Verify credentials
npm run test:credentials

# Start development server
npm run dev
```

### VPS Deployment

#### Prerequisites

* VPS already configured at `170.64.195.49`
* Node.js 20+ installed
* PM2 installed globally: `npm install -g pm2`

#### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'impact-os',
    script: 'dist/index.js',
    cwd: '/home/deploy/impact-os',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/home/deploy/impact-os/logs/error.log',
    out_file: '/home/deploy/impact-os/logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

#### Deployment Commands

```bash
# SSH to VPS
ssh -i "C:\Users\jay_e\.ssh\id_ed25519" deploy@170.64.195.49

# Clone repository
git clone https://github.com/yourusername/impact-os.git
cd impact-os

# Install dependencies
npm install

# Build TypeScript
npm run build

# Copy environment file
cp .env.example .env
nano .env  # Edit with production values

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list (survives reboot)
pm2 save

# Set up PM2 startup script
pm2 startup
```

#### Updating

```bash
cd /home/deploy/impact-os
git pull
npm install
npm run build
pm2 restart impact-os
```

#### Monitoring

```bash
# View logs
pm2 logs impact-os

# View status
pm2 status

# Monitor resources
pm2 monit
```

---

## 15. Claude Code Context

Save this section as `CLAUDE.md` in your project root for Claude Code sessions:

```markdown
# Impact OS — Claude Code Context

## What This Is
Personal accountability system: scheduled email reminders → user replies via polling → AI summarization → Notion logs.

## Tech Stack
- **Runtime**: Node.js 20+ with TypeScript
- **Process Manager**: PM2 on VPS (170.64.195.49)
- **Gmail**: OAuth2, polling every 5 min (no Pub/Sub)
- **Database**: Notion API (Templates, Commitments, Logs)
- **AI**: Gemini 2.0 Flash for summarization

## Architecture Decisions

### Gmail Polling (not Push)
- Simpler than Pub/Sub for <10 emails/day
- Query: `subject:[IMPACT- is:unread`
- Subject token: `[IMPACT-{commitmentSlug}-{YYYYMMDD}]`
- Mark as read after processing

### Idempotency
- Store Gmail Thread ID in Notion Logs
- Check for existing Thread ID before creating new log
- Prevents duplicate processing on retry

## Notion Database IDs
- Templates: `2de06f43-693d-8124-9a4c-ed8b3af61a26`
- Commitments: `2de06f43-693d-81e4-bfd2-c9742dc9efc3`
- Logs: `2de06f43-693d-817f-9f65-f718682f5c7f`
- Reviews Page: `2de06f43-693d-8089-9ddc-f0b4cb09a690`

## Key Interfaces

```typescript
interface Template {
  id: string;
  name: string;
  type: 'Daily' | 'Weekly' | 'Quarterly' | 'Thank-you';
  emailSubject: string;
  emailBody: string;
  active: boolean;
}

interface Commitment {
  id: string;
  slug: string;
  name: string;
  templateId: string;
  frequency: 'Daily' | 'Weekly' | 'Quarterly';
  triggerTime: string;  // "HH:MM"
  cutoffTime: string;   // "HH:MM"
  days?: string[];      // For weekly: ["Mon", "Wed", "Fri"]
  active: boolean;
}

interface LogEntry {
  id?: string;
  commitmentId: string;
  commitmentName: string;
  date: string;         // YYYY-MM-DD
  status: 'Done' | 'Partial' | 'Skipped' | 'Unclear' | 'Awaiting Reply';
  summary: string;
  actions: string[];
  rawInput: string;
  threadId: string;     // Gmail thread ID
  source: 'Email' | 'Manual';
}

interface SummaryResult {
  summary: string;
  actions: string[];
  status: 'Done' | 'Partial' | 'Unclear';
}
```

## Module Responsibilities

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `scheduler.ts` | Check due commitments | `getDueCommitments()`, `scheduleJobs()` |
| `gmail.ts` | Email operations | `sendReminder()`, `pollInbox()`, `markAsRead()` |
| `notion.ts` | Database CRUD | `getCommitments()`, `createLog()`, `updateLog()` |
| `summarizer.ts` | AI processing | `summarizeReply()` → `SummaryResult` |
| `email-parser.ts` | Clean reply text | `stripQuotedText()`, `stripSignature()` |
| `subject-token.ts` | Token handling | `createToken()`, `parseToken()` |

## Commands
```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm run auth:gmail   # One-time OAuth setup
npm run test:credentials  # Verify all APIs
npm run send:test    # Send test reminder
npm run poll:test    # Test inbox polling
```

## Error Handling Pattern
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw new Error('Unreachable');
}
```

## Cron Schedule
```typescript
// In index.ts
import cron from 'node-cron';

// Check for due commitments every minute
cron.schedule('* * * * *', () => scheduler.checkDueCommitments());

// Poll inbox every 5 minutes
cron.schedule('*/5 * * * *', () => gmail.pollInbox());

// Miss detection: runs at specific times based on commitment cutoffs
// (dynamically scheduled based on Commitments database)
```

## Environment Variables
See `.env.example` — Notion credentials pre-filled, Gmail/Gemini need setup.

## VPS Access
```bash
ssh -i "C:\Users\jay_e\.ssh\id_ed25519" deploy@170.64.195.49
```

## Testing Strategy
1. Unit tests for `email-parser` and `subject-token` utilities
2. Integration tests with mock API responses
3. Manual testing via `npm run send:test` and `npm run poll:test`
4. Verify idempotency by running `poll:test` twice
```

---

## 16. Development Sessions Plan

Following the "spec mode before code" approach:

| Session | Goal | Prompts/Focus |
|---------|------|---------------|
| **1** | Spec interrogation | "Walk through edge cases in polling flow. What if Notion is down? What if email has no body?" |
| **2** | Project scaffold | "Create project structure: package.json, tsconfig.json, .env.example, .gitignore" |
| **3** | Types & interfaces | "Create src/types.ts with all interfaces. Create mock implementations for each module." |
| **4** | Gmail module | "Implement gmail.ts: OAuth client setup, sendReminder(), pollInbox(), markAsRead(). Include email-parser utility." |
| **5** | Notion module | "Implement notion.ts: client setup, getTemplates(), getCommitments(), getLogs(), createLog(), updateLog()" |
| **6** | Summarizer | "Implement summarizer.ts with Gemini. Return structured SummaryResult {summary, actions, status}" |
| **7** | Scheduler | "Implement scheduler.ts: checkDueCommitments(), shouldTrigger() logic with timezone handling" |
| **8** | Main + Cron | "Wire everything in index.ts with node-cron. Add structured logging." |
| **9** | Error handling | "Add retry logic with exponential backoff. Implement graceful degradation for each service." |
| **10** | Scripts | "Create scripts/: gmail-auth.ts, test-credentials.ts, send-test-reminder.ts, poll-inbox.ts" |
| **11** | Polish | "Add PM2 config, deployment docs, final testing" |

### Session Tips

* Start each session by reading `CLAUDE.md` context
* Define interfaces before implementation
* Test each module individually before integration
* Use `npm run typecheck` frequently
* Commit working code at end of each session

---

## 17. Success Criteria

The system is considered successful if:

* [ ] Daily reflection occurs with minimal friction
* [ ] Missed commitments are rare and visible (nudge sent)
* [ ] Weekly/quarterly reviews require no manual data gathering
* [ ] Overconsumption decreases due to enforced structure
* [ ] Evidence of impact compounds over time (reviewable logs)
* [ ] System runs unattended for 30+ days without intervention
* [ ] No duplicate log entries (idempotency working)
* [ ] Graceful handling of API failures (no crashes)

---

## 18. Future Extensions

**Explicitly out of scope for v1:**

* Optional local SQLite cache for faster queries
* Optional alternative email providers (Outlook, Fastmail)
* Optional multi-profile support
* Optional analytics dashboards
* Voice input via transcription
* Special AI coaching sessions
* Mobile app companion

These can be added after the core system proves stable.

---

## Appendix A: Quick Reference

### Gmail Query Syntax

```
subject:[IMPACT- is:unread              # All unread Impact emails
subject:[IMPACT-daily-reflection        # Specific commitment
after:2026/01/01 before:2026/01/31      # Date range
```

### Notion Query Filter

```typescript
// Get today's logs for a commitment
{
  filter: {
    and: [
      { property: 'Commitment', relation: { contains: commitmentId } },
      { property: 'Date', date: { equals: '2026-01-10' } },
    ],
  },
}
```

### Gemini Prompt Template

```typescript
const SUMMARY_PROMPT = `
Analyze this reflection response and provide:
1. A 1-2 sentence summary
2. Any action items mentioned (as bullet points)
3. Completion status: "Done" (substantive reflection), "Partial" (brief response), or "Unclear" (minimal/confusing)

Response to analyze:
"""
${cleanedReplyText}
"""

Respond in JSON format:
{
  "summary": "...",
  "actions": ["...", "..."],
  "status": "Done|Partial|Unclear"
}
`;
```

---

## Appendix B: Migration from n8n

This Node.js implementation replaces the previous n8n workflow-based system. Key differences:

| Aspect | n8n (Previous) | Node.js (Current) |
|--------|----------------|-------------------|
| Platform | n8n on VPS | Node.js daemon on same VPS |
| Gmail | Webhook triggers | Polling every 5 min |
| Configuration | n8n UI | `.env` file + code |
| Debugging | n8n execution logs | PM2 logs + structured logging |
| Maintenance | n8n updates | npm updates |

The Notion database structure remains the same — no data migration needed.

---

*Last updated: January 2026*
