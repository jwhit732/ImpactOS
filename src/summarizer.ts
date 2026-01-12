/**
 * AI summarization module using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import { logger } from './utils/logger.js';

export class Summarizer {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = config.gemini.model;
  }

  /**
   * Summarize user reply using Gemini Flash
   * Returns null on failure (per DESIGN_DECISIONS.md #10)
   */
  async summarize(userReply: string, customPrompt?: string): Promise<string | null> {
    logger.debug('Summarizing reply', { replyLength: userReply.length });

    try {
      const prompt = customPrompt
        ? this.buildCustomPrompt(userReply, customPrompt)
        : this.getDefaultPrompt(userReply);

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
   * Default summarization prompt
   */
  private getDefaultPrompt(userReply: string): string {
    return `Summarize the following accountability update concisely (2-3 sentences max):

${userReply}`;
  }
}

export const summarizer = new Summarizer();
