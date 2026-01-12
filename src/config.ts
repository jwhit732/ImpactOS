/**
 * Configuration loader for Impact OS
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Config } from './types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

/**
 * Load and cache 2026 goals file
 * This provides context for email templates and AI summarization
 */
let goalsCache: string | null = null;
let goalsByCategory: Map<string, string> | null = null;

export function loadGoals(): string {
  if (goalsCache) {
    return goalsCache;
  }

  try {
    const goalsPath = join(__dirname, '..', 'GOALS_2026.md');
    goalsCache = readFileSync(goalsPath, 'utf-8');
    return goalsCache;
  } catch (error) {
    console.warn('Warning: Could not load GOALS_2026.md file:', error);
    return '';
  }
}

/**
 * Get goals relevant to specific tags/categories
 * Returns filtered section of goals document
 */
export function getGoalsForTags(tags: string[]): string {
  if (!tags || tags.length === 0) {
    return '';
  }

  const fullGoals = loadGoals();
  if (!fullGoals) {
    return '';
  }

  // Parse goals by category if not already cached
  if (!goalsByCategory) {
    goalsByCategory = new Map();
    const sections = fullGoals.split('\n## ').slice(1); // Skip header

    for (const section of sections) {
      const lines = section.split('\n');
      const category = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      goalsByCategory.set(category, content);
    }
  }

  // Collect relevant goal sections
  const relevantGoals: string[] = [];

  for (const tag of tags) {
    // Map tag names to goal sections
    let categoryKey = tag;

    // Handle variations in naming
    if (tag.includes('Health')) categoryKey = 'Health & Vitality';
    if (tag.includes('Career')) categoryKey = 'Career & Impact';
    if (tag.includes('Relationships')) categoryKey = 'Relationships & Community';
    if (tag.includes('Personal Growth')) categoryKey = 'Personal Growth';
    if (tag.includes('Financial')) categoryKey = 'Financial';
    if (tag.includes('Spiritual')) categoryKey = 'Spiritual';

    const goalContent = goalsByCategory.get(categoryKey);
    if (goalContent) {
      relevantGoals.push(`## ${categoryKey}\n${goalContent}`);
    }
  }

  return relevantGoals.length > 0
    ? relevantGoals.join('\n\n---\n\n')
    : '';
}
