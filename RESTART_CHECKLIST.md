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
I'm continuing Impact OS development. Sessions 1-6 are complete.

CONTEXT:
- Read DESIGN_DECISIONS.md for all critical decisions
- Read CLAUDE.md for project overview
- Read AGENTS_TOOLS.md for agent strategy
- Read SESSION_NOTES.md for complete history
- Read CUSTOMIZATION.md for customization guide

COMPLETED (Sessions 1-6):
✅ Specification interrogation complete
✅ Notion MCP configured and authenticated
✅ Project scaffolding complete (package.json, tsconfig, .gitignore, src/)
✅ All core modules FULLY IMPLEMENTED:
  - src/notion.ts - CRUD with pagination, property mappings, tags support
  - src/gmail.ts - OAuth2, send/poll emails, subject parsing, template variables
  - src/summarizer.ts - Gemini Flash integration with structured output
  - src/scheduler.ts - Cron scheduler with mutex pattern
  - src/config.ts - Goals loader with tag-based filtering
  - src/index.ts - Health check HTTP endpoint (port 3001)
✅ All credentials configured (.env file created)
✅ End-to-end workflow tested successfully
✅ 🚀 PRODUCTION DEPLOYMENT COMPLETE:
  - VPS: 170.64.195.49 (user: deploy)
  - Service: impact-os.service (systemd)
  - Status: Running 24/7
  - Active Commitments: 7
  - Monitoring: Health checks every 15 minutes
  - Backups: Daily at 2 AM
  - Memory: ~103MB usage
✅ 🎨 CUSTOMIZATION FEATURES DEPLOYED:
  - Email template variables: {{commitmentName}}, {{date}}, {{triggerTime}}, {{goalsContext}}
  - Enhanced AI summaries: Structured format with Summary, Key Points, Action Items, Sentiment
  - 2026 IMPACT Goals: GOALS_2026.md deployed with tag-based filtering
  - 7 active commitments (5 new + 2 existing) aligned with IMPACT structure
✅ 📚 DOCUMENTATION COMPLETE:
  - CUSTOMIZATION.md - User guide for all features
  - GOALS_2026.md - 2026 IMPACT goals and systems
  - GitHub repository: https://github.com/jwhit732/ImpactOS

DATABASE IDs:
- Commitments: 2de06f43-693d-81e4-bfd2-c9742dc9efc3
- Templates: 2de06f43-693d-8124-9a4c-ed8b3af61a26
- Logs: 2de06f43-693d-817f-9f65-f718682f5c7f

WHAT'S NEXT:
- System is running with full customization
- Ready for fine-tuning, new features, or adjustments
- All changes go through: local edit → git commit → git push → VPS pull → restart

Tell me what you'd like to work on!
```

---

## Step 8: Future Enhancements (Optional)

Session 6 is complete! The system is fully functional with customization features.

**Potential Future Enhancements:**

1. **Fine-tune Commitments**
   - Adjust trigger times to match your actual schedule
   - Add/remove commitments as needed
   - Refine tags based on focus areas

2. **Customize Email Templates**
   - Edit templates in Notion to add more context
   - Experiment with different variable combinations
   - Test what works best for your workflow

3. **Refine AI Prompts**
   - Adjust summary prompts based on what you find useful
   - Add commitment-specific custom prompts
   - Iterate on action item extraction

4. **Update Goals**
   - Keep GOALS_2026.md current with progress
   - Add quarterly review reminders
   - Track metrics from your IMPACT structure

5. **Additional Features**
   - Monthly/quarterly commitment frequencies
   - Email formatting (HTML instead of plain text)
   - Analytics dashboard for accountability metrics
   - Integration with other tools (calendar, task manager)

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

## Success Criteria - Session 6 (COMPLETED ✅)

Session 6 is complete! Here's what was accomplished:
1. ✅ 5 additional commitments created (7 total active)
2. ✅ Email template system with variable substitution ({{commitmentName}}, {{date}}, {{triggerTime}}, {{goalsContext}})
3. ✅ AI summaries follow structured markdown format (Summary, Key Points, Action Items, Sentiment)
4. ✅ GOALS_2026.md created with actual IMPACT goals
5. ✅ Goals referenced in email reminders via {{goalsContext}} variable
6. ✅ AI summaries are goal-aligned with context injection
7. ✅ All changes deployed and verified in production (7 active commitments detected)
8. ✅ CUSTOMIZATION.md comprehensive guide created
9. ✅ GitHub repository setup with version control
10. ✅ Git-based deployment workflow established

---

**Last Updated**: 2026-01-12 05:15 (Session 6 Complete)
**Next**: Session 7 - Future enhancements as needed
**Current Status**: 🎉 PRODUCTION DEPLOYED WITH FULL CUSTOMIZATION 🎉

**GitHub**: https://github.com/jwhit732/ImpactOS
**VPS**: 170.64.195.49 (7 active commitments)
