\# Impact OS - Claude Code Context



\## Project Overview

Personal accountability system: scheduled email reminders → user replies → AI summarization → Notion logs



\## Architecture

\- Node.js/TypeScript daemon on VPS

\- Gmail polling (not push) every 5 minutes

\- Notion as system of record

\- Gemini Flash for summarization



\## Key Design Decisions

\- Subject tokens: `\[IMPACT-{id}-{YYYYMMDD}]` for thread matching

\- Idempotency: Check threadId in Logs DB before writing

\- No Pub/Sub — polling is simpler for <10 emails/day



\## Module Interfaces (implement separately)

1\. `scheduler.ts` - Cron-based commitment checker

2\. `gmail.ts` - Send/poll/parse emails

3\. `notion.ts` - CRUD for Templates, Commitments, Logs

4\. `summarizer.ts` - Gemini API wrapper



\## Notion Schema

\[Link to CREDENTIALS\_SETUP.md or paste schema here]



\## Commands

\- `npm run dev` - Start with hot reload

\- `npm run send-test` - Send test reminder

\- `npm run poll-test` - Test inbox polling

