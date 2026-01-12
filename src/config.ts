/**
 * Configuration loader for Impact OS
 */

import dotenv from 'dotenv';
import { Config } from './types.js';

dotenv.config();

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const config: Config = {
  gmail: {
    clientId: getEnvVar('GMAIL_CLIENT_ID'),
    clientSecret: getEnvVar('GMAIL_CLIENT_SECRET'),
    redirectUri: getEnvVar('GMAIL_REDIRECT_URI'),
    userEmail: getEnvVar('GMAIL_USER_EMAIL'),
  },
  notion: {
    apiKey: getEnvVar('NOTION_API_KEY'),
    templatesDbId: getEnvVar('NOTION_TEMPLATES_DB_ID'),
    commitmentsDbId: getEnvVar('NOTION_COMMITMENTS_DB_ID'),
    logsDbId: getEnvVar('NOTION_LOGS_DB_ID'),
  },
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY'),
    model: getEnvVar('GEMINI_MODEL', false) || 'gemini-1.5-flash',
  },
  scheduler: {
    pollInterval: getEnvVar('POLL_INTERVAL', false) || '*/5 * * * *',
    timezone: getEnvVar('TIMEZONE', false) || 'America/New_York',
  },
};
