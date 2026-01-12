# Impact OS - Design Decisions Log

**Session 1 Completed**: 2026-01-10
**Status**: Spec interrogation complete, ready for Session 2 (scaffolding)

---

## Critical Design Decisions

### 1. Race Condition: Polling vs Scheduler

**Problem**: Gmail poller might find a reply BEFORE scheduler creates the "Awaiting Reply" log entry.

**Decision**: ✅ **Scheduler creates log BEFORE sending email**
- Flow: Create log entry → Send email → Store messageId in log
- Poller will always find an existing log to update
- Trade-off: May create orphaned logs if email send fails (handled by retry queue)

**Implementation**: In `scheduler.ts`, create log with Status='Awaiting Reply' before calling `gmail.sendReminder()`

---

### 2. Notion Query Pagination

**Problem**: Notion API returns max 100 results per page. With >100 commitments or logs, we'll miss data.

**Decision**: ✅ **Implement pagination loops for ALL queries**
- Use `has_more` and `next_cursor` to fetch all pages
- Critical for Logs DB as it grows unbounded over time
- Essential even for Commitments DB (may grow beyond 100)

**Implementation**: In `notion.ts`, all query functions must loop through pages:
```typescript
let hasMore = true;
let cursor = undefined;
const results = [];
while (hasMore) {
  const response = await notion.databases.query({
    database_id: dbId,
    start_cursor: cursor,
  });
  results.push(...response.results);
  hasMore = response.has_more;
  cursor = response.next_cursor;
}
```

---

### 3. Gmail Thread ID Reliability

**Problem**: User might reply to old reminder email weeks later. ThreadId might not have a corresponding log entry.

**Decision**: ✅ **Parse subject token as fallback**
- Primary: Check threadId for matching log entry
- Fallback: Parse `[IMPACT-slug-YYYYMMDD]` from subject line
- Last resort: Create new log if neither match found

**Implementation**: In `gmail.ts` poller:
```typescript
let log = await notion.getLogByThreadId(threadId);
if (!log) {
  const token = parseSubjectToken(subject);
  log = await notion.getLogBySubjectToken(token.slug, token.date);
}
if (!log) {
  log = await notion.createLog({ /* new entry */ });
}
```

---

### 4. Gmail API Failure During Send

**Problem**: Scheduler tries to send reminder, but Gmail API fails (network, quota, OAuth expired).

**Decision**: ✅ **Only update lastSent after successful send**
- Don't mark as sent unless email actually goes out
- Retry on next scheduler run (1 minute later)
- May spam if issue persists (acceptable trade-off for personal use)

**Implementation**: In `scheduler.ts`:
```typescript
const messageId = await gmail.sendReminder(commitment, template);
// Only update after successful send:
await notion.updateCommitment(commitment.id, { lastSent: new Date() });
```

---

### 5. Subject Token Uniqueness

**Problem**: Format `[IMPACT-{slug}-{YYYYMMDD}]` could have duplicates if two commitments with same slug trigger on same date.

**Decision**: ✅ **Enforce unique slugs in Notion**
- Add validation to ensure commitment slugs are unique
- Manual enforcement when creating commitments
- Simpler than adding database IDs to token

**Implementation**: Document requirement in setup guide. Consider adding a validation script in `scripts/validate-commitments.ts`

---

### 6. Daylight Saving Time

**Problem**: If timezone changes or user travels, commitment times could shift.

**Decision**: ✅ **Always use configured timezone from .env**
- Ignore system timezone
- Always use `TIMEZONE` env var (currently: Australia/Brisbane)
- Update .env if relocating

**Implementation**: In `scheduler.ts`, use luxon with explicit timezone:
```typescript
const now = DateTime.now().setZone(process.env.TIMEZONE);
```

---

### 7. Email Body Parsing

**Problem**: Need to strip email quotes ('>'), signatures, previous email chains. This is notoriously unreliable.

**Decision**: ✅ **Use simple heuristics (recommended for MVP)**
- Split on common markers: `---`, `On ... wrote:`, signatures
- Good enough for personal use
- May miss edge cases (acceptable for MVP)

**Implementation**: In `utils/email-parser.ts`:
```typescript
// Strip common quote markers
text = text.split(/On .* wrote:/)[0];
text = text.split('---')[0];
// Strip signature blocks
text = text.split(/^--$/m)[0];
```

---

### 8. Multiple Replies to Same Reminder

**Problem**: User replies twice to same reminder email. Both replies share same threadId.

**Decision**: ✅ **Update existing log with latest reply**
- Overwrite ReplyText and regenerate summary
- Only most recent response is preserved
- Simpler than concatenation or versioning

**Implementation**: In `gmail.ts` poller:
```typescript
if (existingLog) {
  await notion.updateLog(existingLog.id, {
    replyText: newReplyText,
    summary: newSummary,
    // ... updated fields
  });
}
```

---

### 9. Notion API Failure During Log Write

**Problem**: Gmail sends successfully, but Notion API fails when creating "Awaiting Reply" log. Email is sent but untracked.

**Decision**: ✅ **Store messageId in memory, retry Notion write**
- Keep retry queue in memory
- Attempt to write to Notion on next scheduler cycle
- Data lost if process crashes (acceptable for personal use)

**Implementation**: In `utils/retry.ts`:
```typescript
class InMemoryRetryQueue {
  private queue: Map<string, LogEntry> = new Map();

  add(messageId: string, logEntry: LogEntry) { /* ... */ }
  async retryAll() { /* ... */ }
}
```

In `scheduler.ts`, call `retryQueue.retryAll()` at start of each run.

---

### 10. Gemini API Failure During Summarization

**Problem**: Poller finds reply and extracts text, but Gemini API fails (rate limit, network, API key issue).

**Decision**: ✅ **Store raw reply, leave summary blank**
- Write log entry with ReplyText filled
- Summary/Actions/Status remain empty
- Manual review possible
- Can retry summarization later via script

**Implementation**: In `summarizer.ts`:
```typescript
async function summarizeReply(text: string): Promise<SummaryResult | null> {
  try {
    // Call Gemini API
  } catch (error) {
    logger.error('Gemini API failed', error);
    return null;  // Caller will write partial log
  }
}
```

---

### 11. Commitment Tracking: Last Sent

**Problem**: Need to track when reminder was last sent to prevent duplicates. Property missing from Notion schema.

**Decision**: ✅ **Add 'Last Sent' date property to Commitments DB**
- Store the last send date
- Scheduler checks if already sent today before triggering
- Clean and reliable

**ACTION REQUIRED**: User must add "Last Sent" (Date type) property to Commitments database in Notion UI.

**Implementation**: In `scheduler.ts`:
```typescript
const now = DateTime.now().setZone(process.env.TIMEZONE);
const lastSent = commitment.lastSent
  ? DateTime.fromISO(commitment.lastSent).setZone(process.env.TIMEZONE)
  : null;

const alreadySentToday = lastSent && lastSent.hasSame(now, 'day');
if (alreadySentToday) {
  return; // Skip this commitment
}
```

---

### 12. Scheduler Overlap: Concurrent Runs

**Problem**: Cron runs `checkDueCommitments()` every minute. If checking takes >60 seconds, next cron fires before previous finishes.

**Decision**: ✅ **Use mutex/lock to prevent concurrent runs**
- Simple flag check at function start
- Skip execution if previous run still active
- Log warning if overlap detected

**Implementation**: In `scheduler.ts`:
```typescript
let isRunning = false;

export async function checkDueCommitments() {
  if (isRunning) {
    logger.warn('Previous scheduler run still active, skipping this cycle');
    return;
  }

  isRunning = true;
  try {
    // ... scheduler logic
  } finally {
    isRunning = false;
  }
}
```

---

## Notion Schema Update Required

**CRITICAL**: Before Session 2, add this property to Commitments database:

| Property Name | Type | Description |
|---------------|------|-------------|
| Last Sent | Date | Timestamp of when reminder was last sent. Used to prevent duplicate sends. |

**How to add**:
1. Open Commitments database in Notion: https://notion.so/2de06f43-693d-81e4-bfd2-c9742dc9efc3
2. Click "+ Add a property"
3. Name: "Last Sent"
4. Type: "Date"
5. Save

---

## Implementation Order (Sessions 2-11)

Based on these decisions, the implementation order is:

1. **Session 2**: Project scaffold (package.json, tsconfig, .gitignore)
2. **Session 3**: Types & interfaces (src/types.ts with all interfaces)
3. **Session 4**: Gmail module (sendReminder, pollInbox, markAsRead)
4. **Session 5**: Notion module (ALL queries with pagination loops)
5. **Session 6**: Summarizer (Gemini integration with null return on failure)
6. **Session 7**: Scheduler (mutex, lastSent check, retry queue)
7. **Session 8**: Main + Cron (wire everything with node-cron)
8. **Session 9**: Error handling (exponential backoff, graceful degradation)
9. **Session 10**: Scripts (test-credentials, send-test, poll-test)
10. **Session 11**: Polish & documentation

---

## Agent & Tool Setup Status

### ✅ Completed
- Notion MCP Server configured (local + project scope)
- wshobson/agents marketplace added
- javascript-typescript plugin installed
- backend-development plugin installed

### ⏳ Pending (After Restart)
- Authenticate with Notion MCP via `/mcp`
- Use Notion MCP to add "Last Sent" property to Commitments DB
- Begin Session 2: Project scaffolding

---

## Files Created This Session

1. `.mcp.json` - Notion MCP server configuration (project scope)
2. `.claude.json` - Notion MCP server configuration (local scope)
3. `DESIGN_DECISIONS.md` - This file

**Plugins Installed**:
- wshobson/agents marketplace at `C:\Users\jay_e\.claude\plugins\claude-code-workflows`
- javascript-typescript plugin
- backend-development plugin

---

## Next Session Prompt

When you restart Claude Code, use this prompt to resume:

```
I'm continuing Impact OS development. Session 1 (spec interrogation) is complete.

CONTEXT:
- Read DESIGN_DECISIONS.md for all critical decisions
- Read CLAUDE.md for project overview
- Read AGENTS_TOOLS.md for agent strategy

SETUP STATUS:
- Notion MCP configured, need to authenticate with /mcp
- Plugins installed: javascript-typescript, backend-development

IMMEDIATE TASKS:
1. Authenticate with Notion MCP
2. Use Notion MCP to add "Last Sent" property to Commitments DB
3. Begin Session 2: Project scaffolding (package.json, tsconfig, .gitignore, src/ structure)

Let's start by authenticating with Notion MCP.
```

---

**Session 1 Complete** ✅
**Ready for Session 2**: Project scaffolding with agent assistance
