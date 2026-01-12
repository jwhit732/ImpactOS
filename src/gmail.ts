/**
 * Gmail integration module
 * Send and poll emails, parse subject lines
 */

import { google } from 'googleapis';
import { config, getGoalsForTags } from './config.js';
import { EmailMessage, ParsedSubject, Commitment } from './types.js';
import { logger } from './utils/logger.js';

export class GmailClient {
  private gmail;
  private auth;

  constructor() {
    this.auth = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret,
      config.gmail.redirectUri
    );

    // Load saved tokens from environment (must be set during setup)
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (refreshToken) {
      this.auth.setCredentials({
        refresh_token: refreshToken,
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  /**
   * Send an email with the given subject and body
   * Returns the thread ID of the sent message
   */
  async sendEmail(to: string, subject: string, body: string): Promise<string> {
    logger.debug('Sending email', { to, subject });

    try {
      const message = this.createEmailMessage(to, subject, body);
      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      const threadId = response.data.threadId || '';
      logger.info('Email sent successfully', { to, subject, threadId });

      return threadId;
    } catch (error) {
      logger.error('Error sending email', { to, subject, error });
      throw error;
    }
  }

  /**
   * Poll inbox for new replies with IMPACT token in subject
   * Returns unread messages matching the pattern
   */
  async pollInbox(since?: Date): Promise<EmailMessage[]> {
    logger.debug('Polling inbox', { since });

    try {
      // Build query to find unread IMPACT emails
      let query = 'is:unread subject:IMPACT';
      if (since) {
        const timestamp = Math.floor(since.getTime() / 1000);
        query += ` after:${timestamp}`;
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
      });

      const messages: EmailMessage[] = [];

      if (response.data.messages) {
        for (const msg of response.data.messages) {
          const fullMessage = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          });

          const emailMessage = this.parseGmailMessage(fullMessage.data);
          if (emailMessage) {
            messages.push(emailMessage);
          }
        }
      }

      logger.debug('Inbox poll complete', { count: messages.length });
      return messages;
    } catch (error) {
      logger.error('Error polling inbox', error);
      throw error;
    }
  }

  /**
   * Parse subject line for IMPACT token
   * Format: [IMPACT-{id}-{YYYYMMDD}]
   */
  parseSubject(subject: string): ParsedSubject {
    // Match [IMPACT-{UUID}-{YYYYMMDD}] where UUID contains hyphens
    const match = subject.match(/\[IMPACT-(.+)-(\d{8})\]/);

    if (!match) {
      return {
        commitmentId: '',
        dateToken: '',
        isValid: false,
      };
    }

    return {
      commitmentId: match[1],
      dateToken: match[2],
      isValid: true,
    };
  }

  /**
   * Generate subject line with IMPACT token
   */
  generateSubject(commitmentId: string, baseSubject: string): string {
    const dateToken = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `[IMPACT-${commitmentId}-${dateToken}] ${baseSubject}`;
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      logger.debug('Message marked as read', { messageId });
    } catch (error) {
      logger.error('Error marking message as read', { messageId, error });
    }
  }

  /**
   * Substitute template variables in email body
   * Supported variables:
   * - {{commitmentName}} - Name of the commitment
   * - {{triggerTime}} - When the reminder is sent
   * - {{date}} - Current date in friendly format
   * - {{goalsContext}} - Relevant 2026 goals based on tags
   */
  substituteTemplateVariables(body: string, commitment: Commitment): string {
    let result = body;

    // Basic substitutions
    result = result.replace(/\{\{commitmentName\}\}/g, commitment.name);
    result = result.replace(/\{\{triggerTime\}\}/g, commitment.triggerTime);

    // Date substitution
    const now = new Date();
    const friendlyDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    result = result.replace(/\{\{date\}\}/g, friendlyDate);

    // Goals context substitution
    if (result.includes('{{goalsContext}}')) {
      const goalsContext = commitment.tags && commitment.tags.length > 0
        ? getGoalsForTags(commitment.tags)
        : '';

      if (goalsContext) {
        result = result.replace(/\{\{goalsContext\}\}/g, goalsContext);
      } else {
        // Remove the placeholder if no relevant goals
        result = result.replace(/\{\{goalsContext\}\}/g, '');
      }
    }

    return result;
  }

  /**
   * Create RFC 2822 formatted email message
   */
  private createEmailMessage(to: string, subject: string, body: string): string {
    const lines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ];

    return lines.join('\r\n');
  }

  /**
   * Parse Gmail API message into EmailMessage format
   */
  private parseGmailMessage(data: any): EmailMessage | null {
    try {
      const headers = data.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const dateStr = headers.find((h: any) => h.name === 'Date')?.value || '';

      const body = this.extractEmailBody(data.payload);

      return {
        id: data.id,
        threadId: data.threadId,
        from,
        subject,
        body: this.cleanEmailBody(body),
        date: new Date(dateStr),
      };
    } catch (error) {
      logger.error('Error parsing Gmail message', { messageId: data.id, error });
      return null;
    }
  }

  /**
   * Extract body text from Gmail message payload
   */
  private extractEmailBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }

      // Fallback to first part with data
      for (const part of payload.parts) {
        if (part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }

  /**
   * Clean email body by removing quotes, signatures, etc.
   * Based on DESIGN_DECISIONS.md #7
   */
  private cleanEmailBody(body: string): string {
    let cleaned = body;

    // Remove quoted text (lines starting with >)
    cleaned = cleaned
      .split('\n')
      .filter((line) => !line.trim().startsWith('>'))
      .join('\n');

    // Split on common reply markers
    cleaned = cleaned.split(/On .* wrote:/i)[0];
    cleaned = cleaned.split('---')[0];

    // Split on signature marker
    cleaned = cleaned.split(/^--$/m)[0];

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }
}

export const gmailClient = new GmailClient();
