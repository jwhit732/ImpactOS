/**
 * Test script to poll inbox for replies
 */

import { gmailClient } from '../gmail.js';
import { logger } from '../utils/logger.js';

async function testPoll() {
  try {
    logger.info('Testing inbox polling');

    const messages = await gmailClient.pollInbox();

    logger.info('Poll results', {
      messageCount: messages.length,
      messages: messages.map((m) => ({
        subject: m.subject,
        from: m.from,
        date: m.date,
      })),
    });

    // Test subject parsing
    for (const message of messages) {
      const parsed = gmailClient.parseSubject(message.subject);
      if (parsed.isValid) {
        logger.info('Parsed subject', {
          subject: message.subject,
          commitmentId: parsed.commitmentId,
          dateToken: parsed.dateToken,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to poll inbox', error);
    process.exit(1);
  }
}

testPoll();
