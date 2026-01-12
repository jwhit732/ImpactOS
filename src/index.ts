/**
 * Impact OS - Main entry point
 * Personal accountability system with email reminders and AI summarization
 */

import http from 'http';
import { scheduler } from './scheduler.js';
import { logger } from './utils/logger.js';

async function main() {
  logger.info('Starting Impact OS');

  try {
    // Start health check HTTP server
    const healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        const lastPoll = scheduler.getLastPollTime();
        const lastCheck = scheduler.getLastCheckTime();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            lastPoll: lastPoll ? lastPoll.toISOString() : null,
            lastCheck: lastCheck ? lastCheck.toISOString() : null,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    healthServer.listen(3001, 'localhost');
    logger.info('Health check server listening on http://localhost:3001/health');

    // Start scheduler
    scheduler.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      scheduler.stop();
      healthServer.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      scheduler.stop();
      healthServer.close();
      process.exit(0);
    });

    logger.info('Impact OS is running');
  } catch (error) {
    logger.error('Fatal error in main', error);
    process.exit(1);
  }
}

main();
