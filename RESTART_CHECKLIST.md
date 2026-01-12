# Impact OS - Restart Checklist

Follow these steps EXACTLY after restarting Claude Code.

---

## Step 1: Exit Current Session

Type in this chat:
```
exit
```

---

## Step 2: Start New Claude Code Session

Open your terminal and run:
```bash
cd D:\Projects\OneDrive\Desktop\Coding_projects\ImpactOS_NodeJS
claude
```

Wait for Claude Code to start and show the prompt.

---

## Step 3: Verify MCP Server (CLI Check)

Before doing anything else, verify the MCP server is configured in the CLI:

```bash
claude mcp list
```

**Expected output:**
```
Checking MCP server health...

notion: https://mcp.notion.com/mcp (HTTP) - ⚠ Needs authentication
```

✅ If you see this, MCP is configured correctly.
❌ If you see "No MCP servers configured", something went wrong - let Claude know.

---

## Step 4: Verify MCP Server (Chat Check)

In the NEW Claude Code chat session, type:
```
/mcp
```

**Expected output:**
You should see the Notion MCP server listed with an option to authenticate.

✅ If you see the Notion server, proceed to Step 5.
❌ If you see "No MCP servers configured", tell Claude about it.

---

## Step 5: Authenticate with Notion MCP

In the chat, type:
```
/mcp
```

Follow the OAuth flow:
1. Click the authentication link
2. Log in to your Notion workspace
3. Grant access to the databases
4. Return to Claude Code

**Expected result:**
The Notion MCP server status should change from "⚠ Needs authentication" to "✅ Connected"

---

## Step 6: Verify Plugins

In the chat, type:
```
/plugin
```

**Expected output:**
You should see:
- javascript-typescript (installed)
- backend-development (installed)

✅ If both are listed, plugins are ready.
❌ If missing, tell Claude which ones are missing.

---

## Step 7: Resume Work

Copy and paste this EXACT prompt into the chat:

```
I'm continuing Impact OS development. Sessions 1-5 are complete.

CONTEXT:
- Read DESIGN_DECISIONS.md for all critical decisions
- Read CLAUDE.md for project overview
- Read AGENTS_TOOLS.md for agent strategy
- Read SESSION_NOTES.md for complete history (especially Session 6 goals)

COMPLETED (Sessions 1-5):
✅ Specification interrogation complete
✅ Notion MCP configured and authenticated
✅ Project scaffolding complete (package.json, tsconfig, .gitignore, src/)
✅ All core modules FULLY IMPLEMENTED:
  - src/notion.ts - CRUD with pagination and property mappings
  - src/gmail.ts - OAuth2, send/poll emails, subject parsing
  - src/summarizer.ts - Gemini Flash integration
  - src/scheduler.ts - Cron scheduler with mutex pattern
  - src/index.ts - Health check HTTP endpoint (port 3001)
✅ All credentials configured (.env file created)
✅ End-to-end workflow tested successfully
✅ 🚀 PRODUCTION DEPLOYMENT COMPLETE:
  - VPS: 170.64.195.49 (user: deploy)
  - Service: impact-os.service (systemd)
  - Status: Running 24/7
  - Monitoring: Health checks every 15 minutes
  - Backups: Daily at 2 AM
  - Memory: ~70MB usage

DATABASE IDs:
- Commitments: 2de06f43-693d-81e4-bfd2-c9742dc9efc3
- Templates: 2de06f43-693d-8124-9a4c-ed8b3af61a26
- Logs: 2de06f43-693d-817f-9f65-f718682f5c7f

SESSION 6 GOALS: Customization & 2026 Goals Integration

IMMEDIATE TASKS:
1. Configure additional commitments with different schedules (Daily, Weekly, Quarterly)
2. Design and implement custom email template system
   - Support variable substitution ({{commitmentName}}, {{description}}, etc.)
   - Add personalization and context
3. Enhance AI summarization for more useful outputs
   - Custom prompts per commitment type
   - Structured format (achievements, challenges, next steps)
   - Extract action items from replies
4. Create and integrate "Goals, Strategies & Systems for 2026" resource
   - Decide format: Notion page vs GOALS_2026.md file vs database
   - Reference in email reminders for context
   - Inject into AI summarization prompts for goal-aligned summaries

DESIGN DECISIONS TO MAKE:
- Email templates: Database property vs config file vs inline?
- 2026 Goals format: Notion page vs markdown vs database?
- AI prompts: Hardcoded vs configurable vs per-template?
- Summary structure: JSON vs markdown sections vs free-form?

Let's start Session 6. The system is running in production and ready for customization.
```

---

## Step 8: Session 6 - Customization & Goals

**What Claude will do:**

1. **Make Design Decisions**
   - Decide on email template storage (database vs config file)
   - Choose 2026 goals format (Notion vs markdown file)
   - Determine AI prompt configuration approach
   - Select summary output structure

2. **Configure Additional Commitments**
   - Add test commitments with Daily, Weekly, and Quarterly schedules
   - Verify trigger time calculations for edge cases
   - Test all frequency types in production

3. **Implement Email Template System**
   - Design variable substitution syntax ({{var}})
   - Add template support to src/gmail.ts
   - Create template configuration or database properties
   - Test personalized email sending

4. **Enhance AI Summarization**
   - Create custom prompts for different commitment types
   - Implement structured output format
   - Add action item extraction
   - Test goal-aligned summaries

5. **Integrate 2026 Goals Resource**
   - Create GOALS_2026.md or Notion page
   - Add loader in src/config.ts or src/notion.ts
   - Reference goals in email reminders
   - Inject goals context into AI prompts
   - Test end-to-end with goals integration

---

## Quick Reference: All Commands

| Command | Purpose |
|---------|---------|
| `exit` | Exit current Claude Code session |
| `claude` | Start new Claude Code session |
| `claude mcp list` | Verify MCP servers (CLI) |
| `/mcp` | Manage MCP servers (in chat) |
| `/plugin` | List installed plugins (in chat) |
| `/doctor` | Run diagnostics if issues occur |

---

## Troubleshooting

**Problem: `/mcp` shows "No MCP servers configured"**
- Run `claude mcp list` in terminal to verify CLI sees it
- If CLI sees it but chat doesn't, try `/doctor`
- Share the /doctor output with Claude

**Problem: Notion authentication fails**
- Check your internet connection
- Verify you're logged into Notion in your browser
- Try authenticating again with `/mcp`

**Problem: Plugins missing**
- Run `/plugin` to see what's installed
- If missing, tell Claude which plugins need reinstalling

---

## Success Criteria - Session 2 (COMPLETED ✅)

Session 2 is complete! Here's what was accomplished:
1. ✅ `/mcp` shows Notion server as authenticated
2. ✅ `/plugin` shows both javascript-typescript and backend-development
3. ✅ Claude can read your Commitments database schema
4. ✅ "Last Sent" property added to Commitments DB
5. ✅ Project scaffold created (package.json, tsconfig, .gitignore, src/)
6. ✅ All module files created with TypeScript interfaces and stubs

## Success Criteria - Session 3 (COMPLETED ✅)

Session 3 is complete! Here's what was accomplished:
1. ✅ Dependencies installed (`npm install` runs successfully)
2. ✅ Notion module fully implemented (CRUD for Templates, Commitments, Logs)
3. ✅ Gmail module fully implemented (OAuth2 + send/poll emails)
4. ✅ Gemini summarizer fully implemented
5. ✅ Scheduler logic fully completed
6. ✅ All test scripts working (`npm run send-test`, `npm run poll-test`, `npm run test:credentials`)
7. ✅ End-to-end workflow tested: email sent → user replied → AI summarized → Notion updated
8. ✅ Critical bug fix: Subject parser regex handles UUIDs with hyphens

## Success Criteria - Session 4 (COMPLETED ✅)

Session 4 is complete! Here's what was accomplished:
1. ✅ Daemon runs successfully with `npm run dev`
2. ✅ 5-minute polling cycle works correctly
3. ✅ End-to-end workflow validated in local testing
4. ✅ Deployment plan documented
5. ✅ VPS architecture designed (systemd chosen)
6. ✅ Health check HTTP endpoint added (port 3001)

## Success Criteria - Session 5 (COMPLETED ✅)

Session 5 is complete! Here's what was accomplished:
1. ✅ VPS deployment successful (170.64.195.49)
2. ✅ systemd service configured and running 24/7
3. ✅ Health check endpoint responding
4. ✅ Automated monitoring via cron (every 15 minutes)
5. ✅ Daily backups configured (2 AM)
6. ✅ Production status verified (Memory: 69.5MB, Status: active)
7. ✅ Complete deployment documentation created

## Success Criteria - Session 6 (NEXT)

Session 6 will be complete when:
1. ✅ At least 3 additional commitments configured with different schedules
2. ✅ Email template system implemented with variable substitution
3. ✅ AI summaries follow enhanced structured format
4. ✅ 2026 Goals resource created and accessible
5. ✅ Goals referenced in email reminders
6. ✅ AI summaries are goal-aligned (context-aware)
7. ✅ All changes tested in production without issues
8. ✅ Customization guide documented

---

**Last Updated**: 2026-01-11 19:00 (Session 5 Complete)
**Next**: Session 6 - Customization & 2026 Goals Integration
**Current Status**: 🚀 Production running - Ready for enhancement
