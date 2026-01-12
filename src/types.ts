/**
 * Core type definitions for Impact OS
 */

export interface Template {
  id: string;
  name: string;
  subjectLine: string;
  emailBody: string;
  summaryPrompt: string;
}

export interface Commitment {
  id: string;
  name: string;
  active: boolean;
  frequency: 'Daily' | 'Weekly' | 'Quarterly';
  triggerTime: string;
  cutoffTime: string;
  templateId: string;
  lastSent?: string;
}

export interface Log {
  id: string;
  commitmentId: string;
  dateSent: string;
  threadId: string;
  userReply?: string;
  aiSummary?: string;
  status: 'sent' | 'replied' | 'summarized';
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
}

export interface ParsedSubject {
  commitmentId: string;
  dateToken: string;
  isValid: boolean;
}

export interface Config {
  gmail: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    userEmail: string;
  };
  notion: {
    apiKey: string;
    templatesDbId: string;
    commitmentsDbId: string;
    logsDbId: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  scheduler: {
    pollInterval: string;
    timezone: string;
  };
}
