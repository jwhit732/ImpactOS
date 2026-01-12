/**
 * Notion integration module
 * CRUD operations for Templates, Commitments, and Logs
 */

import { Client } from '@notionhq/client';
import { config } from './config.js';
import { Commitment, Template, Log } from './types.js';
import { logger } from './utils/logger.js';

export class NotionClient {
  private client: Client;

  constructor() {
    this.client = new Client({ auth: config.notion.apiKey });
  }

  // Template operations
  async getTemplate(templateId: string): Promise<Template | null> {
    logger.debug('Getting template', { templateId });

    try {
      const response = await this.client.pages.retrieve({ page_id: templateId });

      if (!('properties' in response)) {
        return null;
      }

      const props = response.properties;

      return {
        id: response.id,
        name: this.extractText(props.Name),
        subjectLine: this.extractText(props['Email Subject']),
        emailBody: this.extractText(props['Email Body']),
        summaryPrompt: this.extractText(props['Summary Prompt']) || '', // Optional field
      };
    } catch (error) {
      logger.error('Error getting template', { templateId, error });
      return null;
    }
  }

  // Commitment operations
  async getActiveCommitments(): Promise<Commitment[]> {
    logger.debug('Getting active commitments');

    const commitments: Commitment[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    try {
      while (hasMore) {
        const response = await this.client.databases.query({
          database_id: config.notion.commitmentsDbId,
          start_cursor: cursor,
          filter: {
            property: 'Active',
            checkbox: {
              equals: true,
            },
          },
        });

        for (const page of response.results) {
          if ('properties' in page) {
            const props = page.properties;

            commitments.push({
              id: page.id,
              name: this.extractText(props.Name),
              active: this.extractCheckbox(props.Active),
              frequency: this.extractSelect(props.Frequency) as 'Daily' | 'Weekly' | 'Quarterly',
              triggerTime: this.extractText(props['Trigger Time']),
              cutoffTime: this.extractText(props['Cutoff Time']),
              templateId: this.extractRelation(props.Template)?.[0] || '',
              lastSent: this.extractDate(props['Last Sent']),
              tags: this.extractMultiSelect(props.Tags),
            });
          }
        }

        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
      }

      logger.debug('Retrieved active commitments', { count: commitments.length });
      return commitments;
    } catch (error) {
      logger.error('Error getting active commitments', error);
      throw error;
    }
  }

  async updateCommitmentLastSent(commitmentId: string, date: string): Promise<void> {
    logger.debug('Updating commitment last sent', { commitmentId, date });

    try {
      await this.client.pages.update({
        page_id: commitmentId,
        properties: {
          'Last Sent': {
            date: {
              start: date,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error updating commitment last sent', { commitmentId, error });
      throw error;
    }
  }

  // Log operations
  async createLog(log: Omit<Log, 'id'>): Promise<Log> {
    logger.debug('Creating log', { log });

    try {
      const response = await this.client.pages.create({
        parent: {
          database_id: config.notion.logsDbId,
        },
        properties: {
          'Commitment': {
            relation: [{ id: log.commitmentId }],
          },
          'Timestamp': {
            date: {
              start: log.dateSent,
            },
          },
          'Gmail Thread ID': {
            rich_text: [
              {
                text: {
                  content: log.threadId,
                },
              },
            ],
          },
          'Status': {
            select: {
              name: log.status === 'sent' ? 'Awaiting Reply' : log.status,
            },
          },
        },
      });

      return {
        id: response.id,
        ...log,
      };
    } catch (error) {
      logger.error('Error creating log', { log, error });
      throw error;
    }
  }

  async getLogByThreadId(threadId: string): Promise<Log | null> {
    logger.debug('Getting log by thread ID', { threadId });

    try {
      let hasMore = true;
      let cursor: string | undefined = undefined;

      while (hasMore) {
        const response = await this.client.databases.query({
          database_id: config.notion.logsDbId,
          start_cursor: cursor,
          filter: {
            property: 'Gmail Thread ID',
            rich_text: {
              equals: threadId,
            },
          },
        });

        if (response.results.length > 0) {
          const page = response.results[0];
          if ('properties' in page) {
            const props = page.properties;

            return {
              id: page.id,
              commitmentId: this.extractRelation(props.Commitment)?.[0] || '',
              dateSent: this.extractDate(props.Timestamp) || '',
              threadId: this.extractText(props['Gmail Thread ID']),
              userReply: this.extractText(props['Raw Input']),
              aiSummary: this.extractText(props.Summary),
              status: this.mapStatus(this.extractSelect(props.Status)),
            };
          }
        }

        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
      }

      return null;
    } catch (error) {
      logger.error('Error getting log by thread ID', { threadId, error });
      return null;
    }
  }

  async updateLogWithReply(logId: string, userReply: string): Promise<void> {
    logger.debug('Updating log with reply', { logId });

    try {
      await this.client.pages.update({
        page_id: logId,
        properties: {
          'Raw Input': {
            rich_text: [
              {
                text: {
                  content: userReply.slice(0, 2000), // Notion limit
                },
              },
            ],
          },
          'Status': {
            select: {
              name: 'Partial', // Map 'replied' to 'Partial'
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error updating log with reply', { logId, error });
      throw error;
    }
  }

  async updateLogWithSummary(logId: string, aiSummary: string): Promise<void> {
    logger.debug('Updating log with summary', { logId });

    try {
      await this.client.pages.update({
        page_id: logId,
        properties: {
          'Summary': {
            rich_text: [
              {
                text: {
                  content: aiSummary.slice(0, 2000), // Notion limit
                },
              },
            ],
          },
          'Status': {
            select: {
              name: 'Done', // Map 'summarized' to 'Done'
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error updating log with summary', { logId, error });
      throw error;
    }
  }

  async updateLogThreadId(logId: string, threadId: string): Promise<void> {
    logger.debug('Updating log with thread ID', { logId, threadId });

    try {
      await this.client.pages.update({
        page_id: logId,
        properties: {
          'Gmail Thread ID': {
            rich_text: [
              {
                text: {
                  content: threadId,
                },
              },
            ],
          },
        },
      });
    } catch (error) {
      logger.error('Error updating log thread ID', { logId, error });
      throw error;
    }
  }

  // Map Notion status values to our internal status
  private mapStatus(notionStatus: string): 'sent' | 'replied' | 'summarized' {
    const statusMap: Record<string, 'sent' | 'replied' | 'summarized'> = {
      'Awaiting Reply': 'sent',
      'Partial': 'replied',
      'Unclear': 'replied',
      'Done': 'summarized',
      'Skipped': 'sent',
    };
    return statusMap[notionStatus] || 'sent';
  }

  // Helper methods to extract data from Notion properties
  private extractText(property: any): string {
    if (!property) return '';

    if (property.type === 'title' && property.title.length > 0) {
      return property.title[0].plain_text || '';
    }

    if (property.type === 'rich_text' && property.rich_text.length > 0) {
      return property.rich_text[0].plain_text || '';
    }

    return '';
  }

  private extractCheckbox(property: any): boolean {
    return property?.checkbox || false;
  }

  private extractSelect(property: any): string {
    return property?.select?.name || '';
  }

  private extractDate(property: any): string | undefined {
    return property?.date?.start;
  }

  private extractRelation(property: any): string[] | undefined {
    if (!property?.relation) return undefined;
    return property.relation.map((rel: any) => rel.id);
  }

  private extractMultiSelect(property: any): string[] | undefined {
    if (!property?.multi_select) return undefined;
    return property.multi_select.map((option: any) => option.name);
  }
}

export const notionClient = new NotionClient();
