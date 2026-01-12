/**
 * Cron-based scheduler for commitment checks and email polling
 */

import cron from 'node-cron';
import { DateTime } from 'luxon';
import { config } from './config.js';
import { notionClient } from './notion.js';
import { gmailClient } from './gmail.js';
import { summarizer } from './summarizer.js';
import { logger } from './utils/logger.js';
import { Commitment } from './types.js';

export class Scheduler {
  private pollTask?: cron.ScheduledTask;
  private checkTask?: cron.ScheduledTask;
  private isCheckingCommitments = false; // Mutex for commitment checks
  private isPollingInbox = false; // Mutex for inbox polling
  private lastPollTime?: Date;
  private lastCheckTime?: Date;

  /**
   * Start the scheduler
   */
  start(): void {
    logger.info('Starting scheduler', {
      pollInterval: config.scheduler.pollInterval,
      timezone: config.scheduler.timezone,
    });

    // Schedule inbox polling every 5 minutes
    this.pollTask = cron.schedule(
      config.scheduler.pollInterval,
      () => this.pollInbox(),
      {
        timezone: config.scheduler.timezone,
      }
    );

    // Schedule commitment checks every minute
    this.checkTask = cron.schedule(
      '* * * * *',
      () => this.checkCommitments(),
      {
        timezone: config.scheduler.timezone,
      }
    );

    logger.info('Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    logger.info('Stopping scheduler');

    if (this.pollTask) {
      this.pollTask.stop();
    }

    if (this.checkTask) {
      this.checkTask.stop();
    }

    logger.info('Scheduler stopped');
  }

  /**
   * Get last inbox poll time (for health checks)
   */
  getLastPollTime(): Date | undefined {
    return this.lastPollTime;
  }

  /**
   * Get last commitment check time (for health checks)
   */
  getLastCheckTime(): Date | undefined {
    return this.lastCheckTime;
  }

  /**
   * Poll inbox for new replies
   * Uses mutex to prevent concurrent runs (DESIGN_DECISIONS.md #12)
   */
  private async pollInbox(): Promise<void> {
    if (this.isPollingInbox) {
      logger.warn('Previous inbox poll still active, skipping this cycle');
      return;
    }

    this.isPollingInbox = true;
    this.lastPollTime = new Date();

    try {
      logger.debug('Polling inbox');

      const messages = await gmailClient.pollInbox();

      for (const message of messages) {
        await this.processReply(message);
        // Mark as read after processing
        await gmailClient.markAsRead(message.id);
      }

      logger.debug('Inbox poll complete', { messageCount: messages.length });
    } catch (error) {
      logger.error('Error polling inbox', error);
    } finally {
      this.isPollingInbox = false;
    }
  }

  /**
   * Process a single reply message
   * Implements DESIGN_DECISIONS.md #8: Update existing log with latest reply
   */
  private async processReply(message: any): Promise<void> {
    try {
      // Parse subject for commitment ID
      const parsed = gmailClient.parseSubject(message.subject);
      if (!parsed.isValid) {
        logger.debug('Skipping message with invalid subject', {
          subject: message.subject,
        });
        return;
      }

      // Get existing log by thread ID
      const existingLog = await notionClient.getLogByThreadId(message.threadId);

      if (!existingLog) {
        logger.warn('No log found for thread', { threadId: message.threadId });
        return;
      }

      // Get commitment to find template
      const commitments = await notionClient.getActiveCommitments();
      const commitment = commitments.find((c) => c.id === existingLog.commitmentId);

      // Get template for custom summary prompt
      const template = commitment
        ? await notionClient.getTemplate(commitment.templateId)
        : null;

      // Update log with reply
      await notionClient.updateLogWithReply(existingLog.id, message.body);

      // Summarize reply (may return null on failure per DESIGN_DECISIONS.md #10)
      const summary = await summarizer.summarize(
        message.body,
        template?.summaryPrompt
      );

      // Update log with summary if available
      if (summary) {
        await notionClient.updateLogWithSummary(existingLog.id, summary);
      } else {
        logger.warn('Summary generation failed, log updated with reply only', {
          logId: existingLog.id,
        });
      }

      logger.info('Reply processed', {
        commitmentId: parsed.commitmentId,
        threadId: message.threadId,
        hasSummary: !!summary,
      });
    } catch (error) {
      logger.error('Error processing reply', error);
    }
  }

  /**
   * Check commitments and send reminders
   * Implements mutex (DESIGN_DECISIONS.md #12)
   * Creates log BEFORE sending email (DESIGN_DECISIONS.md #1)
   * Only updates lastSent after successful send (DESIGN_DECISIONS.md #4)
   */
  async checkCommitments(): Promise<void> {
    if (this.isCheckingCommitments) {
      logger.warn('Previous commitment check still active, skipping this cycle');
      return;
    }

    this.isCheckingCommitments = true;
    this.lastCheckTime = new Date();

    try {
      logger.debug('Checking commitments');

      const commitments = await notionClient.getActiveCommitments();
      const now = DateTime.now().setZone(config.scheduler.timezone);

      for (const commitment of commitments) {
        try {
          if (await this.shouldSendReminder(commitment, now)) {
            await this.sendReminder(commitment, now);
          }
        } catch (error) {
          logger.error('Error processing commitment', {
            commitmentId: commitment.id,
            error,
          });
        }
      }

      logger.debug('Commitment check complete', {
        commitmentCount: commitments.length,
      });
    } catch (error) {
      logger.error('Error checking commitments', error);
    } finally {
      this.isCheckingCommitments = false;
    }
  }

  /**
   * Check if reminder should be sent for this commitment
   * Implements DESIGN_DECISIONS.md #11: Check lastSent before sending
   */
  private async shouldSendReminder(
    commitment: Commitment,
    now: DateTime
  ): Promise<boolean> {
    // Check if already sent today
    if (commitment.lastSent) {
      const lastSent = DateTime.fromISO(commitment.lastSent).setZone(
        config.scheduler.timezone
      );
      if (lastSent.hasSame(now, 'day')) {
        return false;
      }
    }

    // Parse trigger time (format: HH:MM)
    const [hours, minutes] = commitment.triggerTime.split(':').map(Number);
    const triggerTime = now.set({ hour: hours, minute: minutes, second: 0 });

    // Check if we're at or past trigger time
    if (now < triggerTime) {
      return false;
    }

    // For daily commitments, check if already sent today
    if (commitment.frequency === 'Daily') {
      return true;
    }

    // For weekly commitments, check day of week
    if (commitment.frequency === 'Weekly') {
      // Assume Monday trigger - can be enhanced with day configuration
      return now.weekday === 1;
    }

    // For quarterly commitments, check if first day of quarter
    if (commitment.frequency === 'Quarterly') {
      const quarterStart = now.startOf('quarter');
      return now.hasSame(quarterStart, 'day');
    }

    return false;
  }

  /**
   * Send reminder email for a commitment
   * Creates log BEFORE sending (DESIGN_DECISIONS.md #1)
   * Updates lastSent only after successful send (DESIGN_DECISIONS.md #4)
   */
  private async sendReminder(
    commitment: Commitment,
    now: DateTime
  ): Promise<void> {
    try {
      // Get template
      const template = await notionClient.getTemplate(commitment.templateId);
      if (!template) {
        logger.error('Template not found', { templateId: commitment.templateId });
        return;
      }

      // Generate subject with IMPACT token
      const subject = gmailClient.generateSubject(
        commitment.id,
        template.subjectLine
      );

      // Create log entry BEFORE sending (DESIGN_DECISIONS.md #1)
      const log = await notionClient.createLog({
        commitmentId: commitment.id,
        dateSent: now.toISO()!,
        threadId: '', // Will be updated after send
        status: 'sent',
      });

      // Send email
      const threadId = await gmailClient.sendEmail(
        config.gmail.userEmail,
        subject,
        template.emailBody
      );

      // Update log with thread ID
      await notionClient.updateLogThreadId(log.id, threadId);

      // Update commitment lastSent only after successful send (DESIGN_DECISIONS.md #4)
      await notionClient.updateCommitmentLastSent(commitment.id, now.toISO()!);

      logger.info('Reminder sent', {
        commitmentId: commitment.id,
        commitmentName: commitment.name,
        threadId,
      });
    } catch (error) {
      logger.error('Error sending reminder', {
        commitmentId: commitment.id,
        error,
      });
      throw error;
    }
  }
}

export const scheduler = new Scheduler();
