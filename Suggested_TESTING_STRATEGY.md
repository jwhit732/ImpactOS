# Impact OS — Testing Strategy

A robust testing approach designed to increase project success when building with Claude Code.

---

## Philosophy: Tests Before Code

The modern vibe coding best practice is **TDD-first**:

> "Write a crisp spec and failing tests before the agent touches code. The failing test is your contract. When it goes GREEN, you're done. When it stays RED after 3 loops, your spec was wrong."

This transforms vibe coding from "hope it works" to "prove it works."

---

## Testing Pyramid for Impact OS

```
                    ┌─────────────┐
                    │   E2E       │  ← Manual smoke tests
                    │   Tests     │     (real APIs, real flow)
                   ─┴─────────────┴─
                  ┌─────────────────┐
                  │  Integration    │  ← Module combinations
                  │  Tests          │     (mocked external APIs)
                 ─┴─────────────────┴─
                ┌─────────────────────┐
                │    Unit Tests       │  ← Pure functions
                │                     │     (no I/O, no mocks)
               ─┴─────────────────────┴─
```

**Ratio target**: 70% unit, 20% integration, 10% E2E

---

## 1. Unit Tests (Write FIRST)

### What to Unit Test

Pure functions with no external dependencies:

| Module | Functions | Test Focus |
|--------|-----------|------------|
| `subject-token.ts` | `createToken()`, `parseToken()` | Token format, edge cases |
| `email-parser.ts` | `stripQuotedText()`, `stripSignature()` | Various email formats |
| `scheduler.ts` | `shouldTrigger()`, `isWithinWindow()` | Time/timezone logic |
| `config.ts` | `validateConfig()` | Missing env vars |

### TDD Workflow for Units

**Session prompt:**
```
Before implementing subject-token.ts, write failing tests in subject-token.test.ts:

1. createToken() should format as [IMPACT-{slug}-{YYYYMMDD}]
2. createToken() should handle slugs with hyphens
3. parseToken() should extract slug and date from valid token
4. parseToken() should return null for invalid format
5. parseToken() should be case-insensitive

Write the tests first. Run them. They should all fail.
Then implement the minimal code to make each test pass, one at a time.
```

### Example: subject-token.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { createToken, parseToken } from './subject-token';

describe('createToken', () => {
  it('formats token correctly', () => {
    const date = new Date('2026-01-15');
    const result = createToken('daily-reflection', date);
    expect(result).toBe('[IMPACT-daily-reflection-20260115]');
  });

  it('handles slugs with multiple hyphens', () => {
    const date = new Date('2026-01-15');
    const result = createToken('weekly-team-sync', date);
    expect(result).toBe('[IMPACT-weekly-team-sync-20260115]');
  });
});

describe('parseToken', () => {
  it('extracts slug and date from valid token', () => {
    const result = parseToken('[IMPACT-daily-reflection-20260115] Subject');
    expect(result).toEqual({ slug: 'daily-reflection', date: '20260115' });
  });

  it('returns null for invalid format', () => {
    expect(parseToken('Regular email subject')).toBeNull();
    expect(parseToken('[IMPACT-missing-date]')).toBeNull();
    expect(parseToken('[OTHER-prefix-20260115]')).toBeNull();
  });

  it('is case-insensitive', () => {
    const result = parseToken('[impact-DAILY-reflection-20260115]');
    expect(result).toEqual({ slug: 'daily-reflection', date: '20260115' });
  });
});
```

### Example: email-parser.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { stripQuotedText, stripSignature, parseReply } from './email-parser';

describe('stripQuotedText', () => {
  it('removes text after "On ... wrote:" pattern', () => {
    const input = `Thanks for the reminder!

On Mon, Jan 15, 2026 at 9:00 AM Impact OS <noreply@gmail.com> wrote:
> Original message here`;
    
    const result = stripQuotedText(input);
    expect(result).toBe('Thanks for the reminder!');
  });

  it('removes text after "---" delimiter', () => {
    const input = `My reflection for today.

---
Original message`;
    
    const result = stripQuotedText(input);
    expect(result).toBe('My reflection for today.');
  });

  it('handles Gmail mobile format', () => {
    const input = `Quick reply from phone

On Jan 15, 2026, at 9:00 AM, Impact OS wrote:`;
    
    const result = stripQuotedText(input);
    expect(result).toBe('Quick reply from phone');
  });
});

describe('stripSignature', () => {
  it('removes signature after "--" delimiter', () => {
    const input = `Here is my answer.

--
John Doe
CEO, Example Corp`;
    
    const result = stripSignature(input);
    expect(result).toBe('Here is my answer.');
  });

  it('handles "Sent from" signatures', () => {
    const input = `My response

Sent from my iPhone`;
    
    const result = stripSignature(input);
    expect(result).toBe('My response');
  });
});

describe('parseReply', () => {
  it('combines all stripping and trims whitespace', () => {
    const input = `  My actual reply here  

--
Signature

On Mon, Jan 15 wrote:
> Quoted text`;
    
    const result = parseReply(input);
    expect(result).toBe('My actual reply here');
  });

  it('returns empty string for empty/whitespace input', () => {
    expect(parseReply('')).toBe('');
    expect(parseReply('   \n  ')).toBe('');
  });
});
```

---

## 2. Integration Tests (Mocked APIs)

Test module interactions with external APIs mocked.

### What to Integration Test

| Test Scenario | Modules Involved | Mocks Required |
|---------------|------------------|----------------|
| Send reminder flow | scheduler + notion + gmail | Notion API, Gmail API |
| Poll and process reply | gmail + summarizer + notion | Gmail API, Gemini API, Notion API |
| Miss detection | scheduler + notion + gmail | Notion API, Gmail API |
| Idempotency check | gmail + notion | Notion API returns existing log |

### Mock Strategy

Use dependency injection so modules accept API clients:

```typescript
// notion.ts
export function createNotionService(client: NotionClient): NotionService {
  return {
    async getActiveCommitments() {
      const response = await client.databases.query({
        database_id: process.env.NOTION_COMMITMENTS_DB!,
        filter: { property: 'Active', checkbox: { equals: true } },
      });
      return response.results.map(mapToCommitment);
    },
    // ... other methods
  };
}

// In tests, inject a mock client
const mockClient = {
  databases: {
    query: vi.fn().mockResolvedValue({ results: [mockCommitment] }),
  },
};
const service = createNotionService(mockClient as any);
```

### Example: Integration Test

```typescript
// integration/poll-and-process.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGmailService } from '../src/gmail';
import { createNotionService } from '../src/notion';
import { createSummarizer } from '../src/summarizer';
import { processInbox } from '../src/workflows/process-inbox';

describe('Poll and Process Workflow', () => {
  let gmailMock: any;
  let notionMock: any;
  let geminiMock: any;

  beforeEach(() => {
    gmailMock = {
      users: {
        messages: {
          list: vi.fn(),
          get: vi.fn(),
          modify: vi.fn(),
        },
      },
    };
    
    notionMock = {
      databases: { query: vi.fn() },
      pages: { create: vi.fn(), update: vi.fn() },
    };
    
    geminiMock = {
      generateContent: vi.fn(),
    };
  });

  it('processes unread reply and creates log', async () => {
    // Arrange: Gmail returns one unread message
    gmailMock.users.messages.list.mockResolvedValue({
      data: { messages: [{ id: 'msg123', threadId: 'thread456' }] },
    });
    
    gmailMock.users.messages.get.mockResolvedValue({
      data: {
        id: 'msg123',
        threadId: 'thread456',
        payload: {
          headers: [
            { name: 'Subject', value: '[IMPACT-daily-reflection-20260115] Daily Reflection' },
          ],
          body: { data: Buffer.from('My reflection: Great day!').toString('base64') },
        },
      },
    });

    // Arrange: No existing log for this thread
    notionMock.databases.query.mockResolvedValue({ results: [] });

    // Arrange: Gemini returns summary
    geminiMock.generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          summary: 'User had a great day',
          actions: [],
          status: 'Done',
        }),
      },
    });

    // Act
    const gmail = createGmailService(gmailMock);
    const notion = createNotionService(notionMock);
    const summarizer = createSummarizer(geminiMock);
    
    await processInbox({ gmail, notion, summarizer });

    // Assert: Log was created
    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: expect.any(String) },
        properties: expect.objectContaining({
          Status: { select: { name: 'Done' } },
          Summary: { rich_text: [{ text: { content: 'User had a great day' } }] },
        }),
      })
    );

    // Assert: Email was marked as read
    expect(gmailMock.users.messages.modify).toHaveBeenCalledWith({
      userId: 'me',
      id: 'msg123',
      requestBody: { removeLabelIds: ['UNREAD'] },
    });
  });

  it('skips processing if log already exists (idempotency)', async () => {
    // Arrange: Gmail returns message
    gmailMock.users.messages.list.mockResolvedValue({
      data: { messages: [{ id: 'msg123', threadId: 'thread456' }] },
    });
    
    gmailMock.users.messages.get.mockResolvedValue({
      data: {
        id: 'msg123',
        threadId: 'thread456',
        payload: {
          headers: [
            { name: 'Subject', value: '[IMPACT-daily-reflection-20260115] Daily Reflection' },
          ],
        },
      },
    });

    // Arrange: Log ALREADY EXISTS for this thread
    notionMock.databases.query.mockResolvedValue({
      results: [{ id: 'existing-log-id' }],
    });

    // Act
    const gmail = createGmailService(gmailMock);
    const notion = createNotionService(notionMock);
    const summarizer = createSummarizer({} as any); // Won't be called
    
    await processInbox({ gmail, notion, summarizer });

    // Assert: No new log created
    expect(notionMock.pages.create).not.toHaveBeenCalled();
    
    // Assert: Email still marked as read (cleanup)
    expect(gmailMock.users.messages.modify).toHaveBeenCalled();
  });
});
```

---

## 3. Contract Tests (Interface Verification)

Ensure modules conform to their interfaces before integration.

### Contract Test Pattern

```typescript
// contracts/notion-service.contract.ts
import { NotionService } from '../src/types';

export function testNotionServiceContract(service: NotionService) {
  describe('NotionService Contract', () => {
    it('getActiveCommitments returns array of Commitments', async () => {
      const result = await service.getActiveCommitments();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('slug');
        expect(result[0]).toHaveProperty('triggerTime');
      }
    });

    it('findLogByThreadId returns LogEntry or null', async () => {
      const result = await service.findLogByThreadId('nonexistent-thread');
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
}

// Run against mock
testNotionServiceContract(createMockNotionService());

// Run against real (in E2E)
testNotionServiceContract(createNotionService(realClient));
```

---

## 4. End-to-End Tests (Manual Scripts)

For real API verification. Run manually, not in CI.

### Test Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `test:credentials` | Verify all API connections | `npm run test:credentials` |
| `send:test` | Send real test email | `npm run send:test` |
| `poll:test` | Poll real inbox | `npm run poll:test` |
| `e2e:full-cycle` | Complete flow test | `npm run e2e:full-cycle` |

### scripts/e2e-full-cycle.ts

```typescript
/**
 * End-to-End Test: Full Reflection Cycle
 * 
 * Prerequisites:
 * - All credentials configured in .env
 * - Test commitment exists in Notion
 * 
 * What it does:
 * 1. Sends a test reminder email
 * 2. Waits for you to reply manually (or auto-reply in test mode)
 * 3. Polls inbox and processes the reply
 * 4. Verifies log was created in Notion
 * 
 * Run: npm run e2e:full-cycle
 */

import { createGmailService } from '../src/gmail';
import { createNotionService } from '../src/notion';
import { createSummarizer } from '../src/summarizer';
import { processInbox } from '../src/workflows/process-inbox';
import { config } from '../src/config';

async function main() {
  console.log('🧪 Starting E2E Full Cycle Test\n');

  const gmail = createGmailService();
  const notion = createNotionService();
  const summarizer = createSummarizer();

  // Step 1: Send test reminder
  console.log('📤 Step 1: Sending test reminder email...');
  const testSlug = 'e2e-test';
  const threadId = await gmail.sendReminder({
    to: config.YOUR_EMAIL,
    subject: `[IMPACT-${testSlug}-${formatDate(new Date())}] E2E Test`,
    body: 'This is an automated E2E test. Please reply with any text.',
  });
  console.log(`   ✅ Sent! Thread ID: ${threadId}\n`);

  // Step 2: Wait for reply
  console.log('⏳ Step 2: Waiting for reply...');
  console.log('   👉 Please reply to the email you just received.');
  console.log('   👉 Or press Enter to continue with auto-detection...\n');
  
  await waitForKeypress();

  // Step 3: Poll and process
  console.log('📥 Step 3: Polling inbox...');
  const processed = await processInbox({ gmail, notion, summarizer });
  console.log(`   ✅ Processed ${processed.length} messages\n`);

  // Step 4: Verify log
  console.log('🔍 Step 4: Verifying Notion log...');
  const log = await notion.findLogByThreadId(threadId);
  
  if (log) {
    console.log('   ✅ Log found!');
    console.log(`   - Status: ${log.status}`);
    console.log(`   - Summary: ${log.summary}`);
    console.log(`   - Actions: ${log.actions.join(', ') || 'None'}`);
  } else {
    console.log('   ❌ No log found. Test failed.');
    process.exit(1);
  }

  console.log('\n✅ E2E Test Complete!');
}

main().catch(console.error);
```

---

## 5. Error Scenario Tests

Explicitly test failure modes.

```typescript
describe('Error Handling', () => {
  it('handles Gmail API timeout gracefully', async () => {
    gmailMock.users.messages.list.mockRejectedValue(
      new Error('ETIMEDOUT')
    );

    const result = await processInbox({ gmail, notion, summarizer });
    
    // Should not throw, should return empty
    expect(result).toEqual([]);
    // Should log error
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Gmail API error')
    );
  });

  it('handles Notion API rate limit with retry', async () => {
    notionMock.pages.create
      .mockRejectedValueOnce({ code: 'rate_limited' })
      .mockRejectedValueOnce({ code: 'rate_limited' })
      .mockResolvedValueOnce({ id: 'new-page-id' });

    await createLog(mockLogEntry);
    
    // Should have retried 3 times
    expect(notionMock.pages.create).toHaveBeenCalledTimes(3);
  });

  it('logs with Unclear status when Gemini fails', async () => {
    geminiMock.generateContent.mockRejectedValue(
      new Error('Quota exceeded')
    );

    await processReply(mockReply);

    expect(notionMock.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          Status: { select: { name: 'Unclear' } },
          Summary: { rich_text: [{ text: { content: 'AI processing failed' } }] },
          'Raw Input': { rich_text: [{ text: { content: mockReply.body } }] },
        }),
      })
    );
  });
});
```

---

## 6. Testing Session Workflow

### Before Each Implementation Session

```
Session prompt template:

"We're implementing [MODULE]. Before writing any implementation code:

1. Read the interface from types.ts
2. Write failing tests in [module].test.ts covering:
   - Happy path
   - Edge cases (empty input, malformed data)
   - Error scenarios
3. Run the tests - they should all fail
4. Only then implement the minimal code to make each test pass
5. Run tests after each small change

Let's start with the tests."
```

### Test-First Session Example

**Session 4: Gmail Module**

```
Prompt 1:
"Read types.ts for the GmailService interface. Write failing tests for gmail.ts covering:
- sendReminder() creates email with correct subject token
- sendReminder() returns thread ID
- pollInbox() finds unread IMPACT emails
- pollInbox() returns empty array when no matches
- markAsRead() calls correct Gmail API
- Error handling for each method

Write tests only. Don't implement yet."

[Claude writes tests]

Prompt 2:
"Run the tests: npm test src/gmail.test.ts"

[All tests fail - RED]

Prompt 3:
"Now implement gmail.ts with minimal code to make the first test pass."

[Claude implements]

Prompt 4:
"Run tests again."

[Some pass, some fail]

Prompt 5:
"Implement code to make the next failing test pass."

[Iterate until GREEN]
```

---

## 7. CI/CD Integration (Future)

Once tests are stable, add to GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run typecheck
        
      - name: Unit tests
        run: npm run test:unit
        
      - name: Integration tests
        run: npm run test:integration
```

---

## 8. Test Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['scripts/**', '**/*.test.ts'],
    },
    testTimeout: 10000,
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/utils",
    "test:integration": "vitest run integration",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "e2e:credentials": "ts-node scripts/test-credentials.ts",
    "e2e:full-cycle": "ts-node scripts/e2e-full-cycle.ts"
  }
}
```

---

## 9. Testing Checklist per Module

Before marking a module complete:

- [ ] All interface methods have unit tests
- [ ] Happy path tested
- [ ] Empty/null input tested
- [ ] Malformed input tested
- [ ] API error scenarios tested
- [ ] Tests pass independently (no order dependency)
- [ ] No real API calls in unit/integration tests
- [ ] Manual E2E verified at least once

---

## 10. Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Unit test coverage | >80% | Core logic protected |
| Integration test coverage | >60% | Module interactions verified |
| All tests pass | 100% | Deployable confidence |
| Test runtime | <30s | Fast feedback loop |
| E2E success rate | >95% | Real-world reliability |

---

## Summary: Testing Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch

# Unit tests only (fast)
npm run test:unit

# Integration tests only
npm run test:integration

# Manual E2E tests (requires real credentials)
npm run e2e:credentials    # Verify APIs
npm run e2e:full-cycle     # Full flow test
```

---

## Key Principle

> "The failing test is your contract. When it goes GREEN, you're done. When it stays RED after 3 loops, your spec was wrong."

Tests aren't just for catching bugs — they're the **specification** that Claude Code implements against. Write them first, and the implementation becomes a matter of making red turn green.
