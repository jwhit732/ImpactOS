# Impact OS — Agents & Tools Reference

Quick reference for experimental Claude Code features to use on this project.

---

## 1. Notion MCP Server (RECOMMENDED)

Gives Claude Code direct read/write access to your Notion databases during development.

### Setup
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

### Why Use It
- Claude can query your actual database schemas live
- No need to re-explain Notion structure each session
- Can test Notion operations directly from Claude Code
- Verify data without switching to browser

### Your Database IDs
- Templates: `2de06f43-693d-8124-9a4c-ed8b3af61a26`
- Commitments: `2de06f43-693d-81e4-bfd2-c9742dc9efc3`
- Logs: `2de06f43-693d-817f-9f65-f718682f5c7f`

### Example Prompts
- "Use Notion MCP to show me the schema of the Commitments database"
- "Query the Logs database for entries from today"
- "Create a test log entry via MCP to verify the connection"

---

## 2. wshobson/agents Plugins

Community repo with 67 focused plugins for Claude Code. Install only what you need.

### Installation
```bash
# Install plugin system first (if not already)
git clone https://github.com/wshobson/agents.git ~/.claude/plugins/claude-code-workflows

# Then install specific plugins
/plugin install javascript-typescript
/plugin install backend-development
```

### Recommended Plugins for Impact OS

#### `javascript-typescript`
- 4 specialized skills for JS/TS development
- TypeScript patterns and best practices
- Async/await patterns
- Good for: gmail.ts, notion.ts, summarizer.ts modules

#### `backend-development`
- `backend-architect` agent for API design
- `api-design-principles` skill
- `architecture-patterns` skill
- Good for: Designing module interfaces, scheduler logic

### Usage
```bash
# Natural language (Claude picks the right agent)
"Use backend-architect to design the interface for the gmail module"

# Direct command
/backend-development:feature-development gmail polling service
```

### Plugin Model Tiers
- **Sonnet**: Used for architecture/design decisions
- **Haiku**: Used for implementation/boilerplate
- This saves tokens by using cheaper models for routine code

---

## 3. Subagent Pattern (Built-in)

Structure prompts to have Claude work on isolated modules with clear contracts.

### The Pattern
Instead of: "Build the whole system"

Do this:
```
Session 1: "Create TypeScript interfaces for all 4 modules with mock implementations"
Session 2: "Implement gmail.ts against the interface we defined"
Session 3: "Implement notion.ts against the interface we defined"
...etc
```

### Interface-First Development
```typescript
// Define this FIRST, implement LATER
interface GmailService {
  sendReminder(commitment: Commitment, template: Template): Promise<string>; // returns threadId
  pollInbox(): Promise<InboxMessage[]>;
  markAsRead(messageId: string): Promise<void>;
}

interface NotionService {
  getActiveCommitments(): Promise<Commitment[]>;
  getTemplate(id: string): Promise<Template>;
  createLog(entry: LogEntry): Promise<string>;
  updateLog(id: string, updates: Partial<LogEntry>): Promise<void>;
  findLogByThreadId(threadId: string): Promise<LogEntry | null>;
}
```

### Benefits
- Each session is focused and bounded
- Easier to test modules in isolation
- Claude doesn't go off-track building everything at once
- Lower token usage per session

---

## 4. Spec Mode Workflow (Ben Tossell's Approach)

Before writing code, interrogate the design.

### Phase 1: Question Everything
```
"Walk me through the polling flow step by step. What happens if:"
- Gmail API is down?
- Notion API is down?
- Email has no body text?
- User replies twice to same email?
- User replies after cutoff time?
```

### Phase 2: Document Decisions
After discussion, have Claude update CLAUDE.md with decisions:
```
"Add these edge case decisions to the CLAUDE.md architecture section"
```

### Phase 3: Implement Against Spec
```
"Now implement gmail.ts following the decisions we documented"
```

---

## 5. Autonomy Settings

For routine implementation after spec is agreed:

### High Autonomy (Let It Rip)
```bash
claude --autonomy high
```
- Good for: Boilerplate, implementing agreed interfaces
- Watch the stream, intervene if it goes wrong

### Low Autonomy (Step by Step)
```bash
claude --autonomy low
```
- Good for: Complex logic, debugging, exploring options
- Claude asks before each action

---

## 6. Recommended Session Flow

### Session Start Checklist
1. Load CLAUDE.md context: `"Read CLAUDE.md for project context"`
2. Connect Notion MCP: `/mcp` to verify connection
3. State session goal clearly

### Example Session Prompts

**Session 1 - Spec Interrogation:**
```
Read CLAUDE.md. Let's interrogate the design before coding.
Walk me through what happens when:
1. A reminder is due but Notion is unreachable
2. A user replies to an email that's already been processed
3. Two commitments are due at the exact same minute
```

**Session 2 - Project Scaffold:**
```
Read CLAUDE.md. Create the project scaffold:
- package.json with dependencies listed in spec
- tsconfig.json for Node.js
- .gitignore (include .env, credentials.json, node_modules, dist)
- Empty src/ structure matching the spec
```

**Session 3 - Types:**
```
Read CLAUDE.md. Create src/types.ts with all interfaces.
Then create mock implementations in each module file that satisfy the interfaces but just log "not implemented".
```

**Session 4 - Gmail Module:**
```
Read CLAUDE.md. Implement src/gmail.ts:
- OAuth2 client setup from environment variables
- sendReminder() - sends email with subject token
- pollInbox() - queries for unread IMPACT emails
- markAsRead() - marks message as read
- Include src/utils/email-parser.ts for stripping quotes/signatures
Use the interfaces from types.ts.
```

---

## 7. Quick Commands Reference

```bash
# MCP
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp list
/mcp  # Check status in Claude Code

# Plugins (wshobson/agents)
/plugin install javascript-typescript
/plugin install backend-development
/plugin list

# Session management
claude --model sonnet  # Use Sonnet for this session
claude --autonomy high  # High autonomy mode

# In-session
/clear  # Clear context
/cost   # Check token usage
```

---

## 8. Token Management Tips

1. **Use plugins selectively** - Each plugin adds to context. Only install what you need.

2. **Keep sessions focused** - One module per session is cheaper than "build everything"

3. **Mock first** - Creating interfaces + mocks is cheap. Implementation is expensive.

4. **Use Notion MCP** - Querying live data is cheaper than re-explaining schemas every session

5. **Commit frequently** - If Claude Code crashes, you don't lose work

---

## Summary: What to Tell Claude Code

At the start of your first session, you can paste this:

```
I'm building Impact OS, a personal accountability system. Key context:

TOOLS TO USE:
1. Notion MCP - already connected, use it to query my databases directly
2. Backend-development plugin for architecture decisions
3. Subagent pattern - we'll build one module at a time with interfaces first

APPROACH:
- Spec mode first: question the design before coding
- Interface-first: define types.ts, then implement against it
- One module per session: gmail.ts, notion.ts, summarizer.ts, scheduler.ts

PROJECT CONTEXT:
- Read CLAUDE.md for full spec
- Node.js/TypeScript daemon with Gmail polling (not Pub/Sub)
- Notion for storage, Gemini for AI summarization
- VPS deployment with PM2

Let's start with [SESSION GOAL].
```
