/**
 * Process inbox replies once
 */

import { scheduler } from '../scheduler.js';
import { logger } from '../utils/logger.js';

async function processReplies() {
  logger.info('Processing inbox replies...');

  // Access the private pollInbox method via reflection
  // @ts-ignore - accessing private method for testing
  await scheduler['pollInbox']();

  logger.info('Reply processing complete');
}

processReplies();
