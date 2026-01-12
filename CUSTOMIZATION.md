# Impact OS - Customization Guide

This guide explains how to customize email templates, AI summarization, and integrate your 2026 goals.

---

## Table of Contents

1. [Email Template Variables](#email-template-variables)
2. [Customizing Email Templates in Notion](#customizing-email-templates-in-notion)
3. [Linking Commitments to Goals](#linking-commitments-to-goals)
4. [Updating Your 2026 Goals](#updating-your-2026-goals)
5. [Enhanced AI Summarization](#enhanced-ai-summarization)
6. [Examples](#examples)

---

## Email Template Variables

Impact OS supports dynamic variable substitution in email bodies. Use these variables in your Notion templates:

### Available Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{commitmentName}}` | Name of the commitment | "Morning Gratitude Practice" |
| `{{triggerTime}}` | Time the reminder is sent | "06:00" |
| `{{date}}` | Current date (friendly format) | "Monday, January 13, 2026" |
| `{{goalsContext}}` | Relevant 2026 goals (based on tags) | Filtered goal sections |

### How Variables Work

- Variables are wrapped in double curly braces: `{{variableName}}`
- They are replaced at runtime when the email is sent
- If a variable has no value, it's removed from the email
- `{{goalsContext}}` is only included if the commitment has tags set

---

## Customizing Email Templates in Notion

### 1. Open the Templates Database

Visit: https://notion.so/2de06f43-693d-8124-9a4c-ed8b3af61a26

### 2. Edit the Email Body Field

Click on any template and modify the "Email Body" property.

### Example Template (Basic):

```
Good morning!

This is your daily reminder for: {{commitmentName}}

Take a moment to reflect and reply with your update.

Best,
Impact OS
```

### Example Template (With Goals Context):

```
Hello!

Time for your {{commitmentName}} check-in.

Today is {{date}}, and your scheduled time is {{triggerTime}}.

Remember your 2026 goals:
{{goalsContext}}

Reply to this email with your progress, challenges, or insights.

Looking forward to your update!

Impact OS
```

### Tips:

- Keep emails concise and actionable
- Use `{{goalsContext}}` sparingly (it can be lengthy)
- Test templates with a single commitment before scaling

---

## Linking Commitments to Goals

Each commitment can be tagged with one or more goal categories. This enables:
- Personalized email reminders with relevant goal context
- Context-aware AI summaries aligned with your goals

### 1. Open the Commitments Database

Visit: https://notion.so/2de06f43-693d-81e4-bfd2-c9742dc9efc3

### 2. Set Tags for Each Commitment

Click on a commitment and select one or more tags from the "Tags" field:

**Available Tags:**
- Health & Vitality
- Career & Impact
- Relationships & Community
- Personal Growth
- Financial
- Spiritual

### Example Mappings:

| Commitment | Tags |
|------------|------|
| Morning Gratitude Practice | Personal Growth, Spiritual |
| Weekly Review | Career & Impact, Personal Growth |
| Exercise Tracker | Health & Vitality |
| Family Time | Relationships & Community |
| Budget Review | Financial |

---

## Updating Your 2026 Goals

Your goals are stored in `GOALS_2026.md` at the project root.

### 1. Edit the Goals File

Open `GOALS_2026.md` in any text editor.

### 2. Update Goal Categories

The file is structured by category:

```markdown
## Health & Vitality

### Goals
- Maintain consistent morning exercise routine (5+ days/week)
- Achieve and sustain target weight and body composition

### Strategies
- Morning movement before checking phone/email
- Prepare meals in advance

### Systems
- Morning gratitude + exercise (6:00 AM daily)
- Weekly meal prep (Sunday afternoons)
```

### 3. Deploy Updated Goals

After editing `GOALS_2026.md`:

1. Commit changes: `git add GOALS_2026.md && git commit -m "Update 2026 goals"`
2. Push to GitHub: `git push origin main`
3. Deploy to VPS: SSH and run `git pull` in `/home/deploy/impact-os/`
4. Restart service: `sudo systemctl restart impact-os`

The goals are loaded on startup, so a restart is required for changes to take effect.

---

## Enhanced AI Summarization

AI summaries now follow a structured format for consistency and actionability.

### Default Output Format:

```markdown
## Summary
[2-3 sentences capturing the essence of the update]

## Key Points
- [Main point 1]
- [Main point 2]
- [Additional points as needed]

## Action Items
[If specific actions or commitments were mentioned]
- [ ] [Action item 1]
- [ ] [Action item 2]

## Sentiment
[Positive/Neutral/Challenging - based on the overall tone]
```

### How Goals Influence Summaries

When a commitment has tags, the relevant goal sections are included in the AI prompt. This helps the AI:
- Align summaries with your stated goals
- Identify progress toward specific objectives
- Highlight areas needing attention

### Custom Summary Prompts

You can still override the default prompt by setting the "Summary Prompt" field in the Templates database. This is useful for:
- Specific question formats
- Domain-specific terminology
- Alternate output formats

---

## Examples

### Example 1: Morning Routine Commitment

**Template (Email Body):**
```
Good morning!

Time for your {{commitmentName}} check-in.

Today is {{date}}.

Quick reminder of what you're working toward:
{{goalsContext}}

Reply with:
1. What you did this morning
2. How you're feeling
3. Any challenges

Let's build momentum!
```

**Commitment Setup:**
- Name: "Morning Routine Tracker"
- Tags: Health & Vitality, Personal Growth
- Trigger Time: 06:00

**Result:**
The email will include your Health & Vitality and Personal Growth goals from `GOALS_2026.md`.

---

### Example 2: Weekly Review

**Template (Email Body):**
```
Hello!

It's time for your {{commitmentName}}.

This week, focus on:
{{goalsContext}}

Reply with your weekly review covering:
- Wins this week
- Challenges faced
- Priorities for next week
- Progress on key goals

See you next week!
```

**Commitment Setup:**
- Name: "Weekly Reflection"
- Tags: Career & Impact, Personal Growth, Financial
- Frequency: Weekly
- Trigger Time: 17:00 (Friday)

**AI Summary:**
The AI will generate a structured summary that references your career, personal growth, and financial goals.

---

### Example 3: Simple Daily Check-In

**Template (Email Body):**
```
Hey!

Quick check-in for {{commitmentName}}.

How did it go today?

Reply with a brief update.
```

**Commitment Setup:**
- Name: "Meditation Practice"
- Tags: Spiritual, Personal Growth
- Frequency: Daily
- Trigger Time: 20:00

**Result:**
The `{{goalsContext}}` variable isn't used in this template, so no goals will be included in the email. The AI summary will still reference the commitment's tags when analyzing your reply.

---

## Best Practices

### Email Templates:
1. **Be concise** - Shorter emails get better response rates
2. **Use goals context selectively** - Not every email needs all your goals
3. **Test before scaling** - Try new templates on one commitment first
4. **Iterate** - Adjust based on what works for you

### Goal Tags:
1. **Start specific** - Better to have 1-2 precise tags than all 6
2. **Align with reality** - Tag commitments based on what they actually track
3. **Review quarterly** - Update tags as your focus shifts

### Goals Document:
1. **Keep it current** - Review and update quarterly
2. **Be specific** - Vague goals lead to vague summaries
3. **Focus on systems** - The "Systems" section is most actionable
4. **Use concrete language** - "5+ days/week" vs "exercise more"

---

## Troubleshooting

### Variables Not Substituting

**Problem:** Email contains literal `{{variableName}}` text

**Solution:**
- Check spelling (case-sensitive)
- Ensure double curly braces: `{{var}}` not `{var}` or `[[var]]`
- Restart Impact OS service after template changes

### Goals Not Appearing

**Problem:** `{{goalsContext}}` is empty in emails

**Possible Causes:**
1. Commitment has no tags set → Add tags in Notion
2. Tag names don't match → Use exact names from Commitments database
3. `GOALS_2026.md` not deployed → Git pull and restart service

### AI Summaries Generic

**Problem:** AI summaries don't reference goals

**Possible Causes:**
1. Commitment has no tags → Add tags in Notion
2. Goals file outdated → Update `GOALS_2026.md`
3. Cache issue → Restart Impact OS service

---

## Advanced Customization

### Adding New Variables

To add custom variables, modify `src/gmail.ts`:

1. Edit the `substituteTemplateVariables()` method
2. Add your variable logic
3. Rebuild: `npm run build`
4. Redeploy to production

### Custom AI Prompts Per Commitment Type

1. Create different templates in Notion for different commitment types
2. Use the "Summary Prompt" field to override default AI behavior
3. Test prompts locally before deploying

### Goal Category Customization

To add or rename goal categories:

1. Update `GOALS_2026.md` with new section headers
2. Update Tags in Commitments database (Notion UI)
3. Update mapping in `src/config.ts` → `getGoalsForTags()`
4. Rebuild and redeploy

---

## Need Help?

- **Check logs:** `journalctl -u impact-os -f`
- **Health check:** `curl http://localhost:3001/health`
- **Test credentials:** `npm run test-credentials`
- **Notion databases:** Check that Tags field exists and templates are properly formatted

---

*Last Updated: January 2026 (Session 6)*
