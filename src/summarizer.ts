/**
 * AI summarization module using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, getGoalsForTags } from './config.js';
import { logger } from './utils/logger.js';
import { Commitment } from './types.js';

export class Summarizer {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = config.gemini.model;
  }

  /**
   * Summarize user reply using Gemini Flash with enhanced context and structured output
   * Returns null on failure (per DESIGN_DECISIONS.md #10)
   */
  async summarize(
    userReply: string,
    commitment?: Commitment,
    customPrompt?: string
  ): Promise<string | null> {
    logger.debug('Summarizing reply', { replyLength: userReply.length });

    try {
      const prompt = customPrompt
        ? this.buildCustomPrompt(userReply, customPrompt)
        : this.getEnhancedPrompt(userReply, commitment);

      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      logger.info('Summary generated', { summaryLength: summary.length });

      return summary.trim();
    } catch (error) {
      logger.error('Gemini API failed', error);
      return null; // Per DESIGN_DECISIONS.md #10: return null on failure
    }
  }

  /**
   * Build prompt using custom template
   */
  private buildCustomPrompt(userReply: string, customPrompt: string): string {
    // Replace placeholder in custom prompt if it exists
    if (customPrompt.includes('{reply}')) {
      return customPrompt.replace('{reply}', userReply);
    }

    // Otherwise append the reply
    return `${customPrompt}\n\n${userReply}`;
  }

  /**
   * Enhanced summarization prompt with structured output and goals context
   */
  private getEnhancedPrompt(userReply: string, commitment?: Commitment): string {
    const commitmentName = commitment?.name || 'accountability commitment';

    // Get relevant goals context if commitment has tags
    const goalsContext = commitment?.tags && commitment.tags.length > 0
      ? getGoalsForTags(commitment.tags)
      : '';

    const goalsSection = goalsContext
      ? `\n\nRelated 2026 Goals:\n${goalsContext}`
      : '';

    return `You are analyzing an accountability update for: "${commitmentName}"${goalsSection}

User's Update:
${userReply}

Provide a structured analysis in the following markdown format:

## Summary
[2-3 sentences capturing the essence of the update]

## Key Points
- [Main point 1]
- [Main point 2]
- [Additional points as needed]

## Action Items
[If specific actions or commitments were mentioned, list them as checkboxes. If none, write "None mentioned"]
- [ ] [Action item 1]
- [ ] [Action item 2]

## Sentiment
[One word: Positive, Neutral, or Challenging - based on the overall tone]

Be concise, insightful, and focus on what matters most.`;
  }

}

export const summarizer = new Summarizer();
