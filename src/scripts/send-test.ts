/**
 * Test script to send a sample reminder email
 */

import { gmailClient } from '../gmail.js';
import { notionClient } from '../notion.js';
import { logger } from '../utils/logger.js';

async function sendTestReminder() {
  try {
    logger.info('Sending test reminder');

    // Get first active commitment
    const commitments = await notionClient.getActiveCommitments();
    if (commitments.length === 0) {
      logger.error('No active commitments found');
      process.exit(1);
    }

    const commitment = commitments[0];
    logger.info('Using commitment', { name: commitment.name });

    // Get template
    const template = await notionClient.getTemplate(commitment.templateId);
    if (!template) {
      logger.error('Template not found', { templateId: commitment.templateId });
      process.exit(1);
    }

    // Generate subject with IMPACT token
    const subject = gmailClient.generateSubject(commitment.id, template.subjectLine);

    // Send email
    const threadId = await gmailClient.sendEmail(
      process.env.GMAIL_USER_EMAIL || '',
      subject,
      template.emailBody
    );

    logger.info('Email sent', { threadId, subject });

    // Create log entry
    const log = await notionClient.createLog({
      commitmentId: commitment.id,
      dateSent: new Date().toISOString(),
      threadId,
      status: 'sent',
    });

    logger.info('Log created', { logId: log.id });
    logger.info('Test reminder sent successfully');
  } catch (error) {
    logger.error('Failed to send test reminder', error);
    process.exit(1);
  }
}

sendTestReminder();
